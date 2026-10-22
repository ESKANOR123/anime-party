const { activeRooms } = require('./routes/rooms');

function setupSocketIO(io) {
  const socketUsers = new Map();

  io.on('connection', (socket) => {
    // 1. JOIN ROOM
    socket.on('room:join', ({ roomCode, username, avatar, isCameraOn = false, isMicOn = false }) => {
      const code = (roomCode || '').trim().toUpperCase();
      let room = activeRooms.get(code);

      if (!room) {
        room = {
          id: 'room-' + Date.now(),
          code,
          title: `${username}ning xonasi`,
          hostId: socket.id,
          hostName: username,
          hostAvatar: avatar,
          currentAnime: null,
          currentEpisodeIndex: 0,
          currentVideo: null,
          currentTime: 0,
          isPlaying: false,
          playbackRate: 1,
          createdAt: new Date().toISOString(),
          participants: []
        };
        activeRooms.set(code, room);
      }

      const isHost = (room.hostId === socket.id) || (room.participants.length === 0);
      if (isHost) {
        room.hostId = socket.id;
        room.hostName = username;
      }

      socket.join(code);

      const userInfo = {
        socketId: socket.id,
        username: username || 'Foydalanuvchi',
        avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${socket.id}`,
        isCameraOn,
        isMicOn,
        isHost
      };

      socketUsers.set(socket.id, { ...userInfo, roomCode: code });

      room.participants = room.participants.filter(p => p.socketId !== socket.id);
      room.participants.push(userInfo);

      const existingPeers = room.participants.filter(p => p.socketId !== socket.id);

      socket.emit('room:joined', {
        room: {
          code: room.code,
          title: room.title,
          hostId: room.hostId,
          hostName: room.hostName,
          currentAnime: room.currentAnime,
          currentEpisodeIndex: room.currentEpisodeIndex,
          currentVideo: room.currentVideo,
          currentTime: room.currentTime,
          isPlaying: room.isPlaying
        },
        peers: existingPeers,
        self: userInfo
      });

      socket.to(code).emit('peer:joined', userInfo);

      io.to(code).emit('chat:message', {
        id: 'sys-' + Date.now(),
        type: 'system',
        text: `${username} xonaga qo‘shildi!`,
        timestamp: new Date().toISOString()
      });
    });

    // 2. WebRTC SIGNALING
    socket.on('webrtc:offer', ({ toSocketId, offer }) => {
      io.to(toSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        offer
      });
    });

    socket.on('webrtc:answer', ({ toSocketId, answer }) => {
      io.to(toSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        answer
      });
    });

    socket.on('webrtc:ice-candidate', ({ toSocketId, candidate }) => {
      io.to(toSocketId).emit('webrtc:ice-candidate', {
        fromSocketId: socket.id,
        candidate
      });
    });

    // 3. MEDIA STATUS TOGGLE
    socket.on('media:toggle', ({ type, enabled }) => {
      const user = socketUsers.get(socket.id);
      if (!user) return;

      if (type === 'camera') user.isCameraOn = enabled;
      if (type === 'mic') user.isMicOn = enabled;

      const room = activeRooms.get(user.roomCode);
      if (room) {
        const p = room.participants.find(p => p.socketId === socket.id);
        if (p) {
          if (type === 'camera') p.isCameraOn = enabled;
          if (type === 'mic') p.isMicOn = enabled;
        }
      }

      socket.to(user.roomCode).emit('peer:media-toggled', {
        socketId: socket.id,
        type,
        enabled
      });
    });

    // 4. WATCH PARTY SYNCHRONIZATION
    socket.on('video:play', ({ currentTime }) => {
      const user = socketUsers.get(socket.id);
      if (!user) return;
      const room = activeRooms.get(user.roomCode);
      if (room) {
        room.isPlaying = true;
        room.currentTime = currentTime;
      }
      socket.to(user.roomCode).emit('video:play', {
        currentTime,
        triggeredBy: user.username
      });
    });

    socket.on('video:pause', ({ currentTime }) => {
      const user = socketUsers.get(socket.id);
      if (!user) return;
      const room = activeRooms.get(user.roomCode);
      if (room) {
        room.isPlaying = false;
        room.currentTime = currentTime;
      }
      socket.to(user.roomCode).emit('video:pause', {
        currentTime,
        triggeredBy: user.username
      });
    });

    socket.on('video:seek', ({ currentTime }) => {
      const user = socketUsers.get(socket.id);
      if (!user) return;
      const room = activeRooms.get(user.roomCode);
      if (room) {
        room.currentTime = currentTime;
      }
      socket.to(user.roomCode).emit('video:seek', {
        currentTime,
        triggeredBy: user.username
      });
    });

    // Change full anime
    socket.on('video:change', ({ video, episodeIndex = 0 }) => {
      const user = socketUsers.get(socket.id);
      if (!user) return;
      const room = activeRooms.get(user.roomCode);
      if (room) {
        room.currentAnime = video;
        room.currentEpisodeIndex = episodeIndex;

        const ep = (video.episodes && video.episodes[episodeIndex]) 
          ? video.episodes[episodeIndex] 
          : (video.episodes?.[0] || null);

        room.currentVideo = ep ? {
          title: `${video.title} — ${ep.title}`,
          episodeTitle: ep.title,
          episodeNumber: ep.episodeNumber,
          url: ep.url,
          thumbnail: video.thumbnail
        } : video;

        room.currentTime = 0;
        room.isPlaying = false;
      }
      io.to(user.roomCode).emit('video:change', {
        currentAnime: room.currentAnime,
        currentEpisodeIndex: room.currentEpisodeIndex,
        video: room.currentVideo,
        triggeredBy: user.username
      });
      io.to(user.roomCode).emit('chat:message', {
        id: 'sys-' + Date.now(),
        type: 'system',
        text: `${user.username} yangi anime qo‘ydi: "${room.currentVideo.title}"`,
        timestamp: new Date().toISOString()
      });
    });

    // Switch episode inside current series!
    socket.on('video:change-episode', ({ episodeIndex }) => {
      const user = socketUsers.get(socket.id);
      if (!user) return;
      const room = activeRooms.get(user.roomCode);
      if (!room || !room.currentAnime || !room.currentAnime.episodes) return;

      const idx = Math.max(0, Math.min(episodeIndex, room.currentAnime.episodes.length - 1));
      const ep = room.currentAnime.episodes[idx];

      room.currentEpisodeIndex = idx;
      room.currentVideo = {
        title: `${room.currentAnime.title} — ${ep.title}`,
        episodeTitle: ep.title,
        episodeNumber: ep.episodeNumber,
        url: ep.url,
        thumbnail: room.currentAnime.thumbnail
      };
      room.currentTime = 0;
      room.isPlaying = false;

      io.to(user.roomCode).emit('video:change-episode', {
        episodeIndex: idx,
        video: room.currentVideo,
        triggeredBy: user.username
      });

      io.to(user.roomCode).emit('chat:message', {
        id: 'sys-' + Date.now(),
        type: 'system',
        text: `${user.username} yangi qismga o‘tdi: ${ep.title}`,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('video:sync-tick', ({ currentTime, isPlaying }) => {
      const user = socketUsers.get(socket.id);
      if (!user) return;
      const room = activeRooms.get(user.roomCode);
      if (room && room.hostId === socket.id) {
        room.currentTime = currentTime;
        room.isPlaying = isPlaying;
        socket.to(user.roomCode).emit('video:sync-tick', { currentTime, isPlaying });
      }
    });

    // 5. CHAT & EMOJI REACTIONS
    socket.on('chat:send', ({ text }) => {
      const user = socketUsers.get(socket.id);
      if (!user || !text || !text.trim()) return;

      const message = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        type: 'user',
        senderId: socket.id,
        username: user.username,
        avatar: user.avatar,
        text: text.trim(),
        timestamp: new Date().toISOString()
      };

      io.to(user.roomCode).emit('chat:message', message);
    });

    socket.on('reaction:send', ({ emoji }) => {
      const user = socketUsers.get(socket.id);
      if (!user || !emoji) return;

      io.to(user.roomCode).emit('reaction:receive', {
        emoji,
        username: user.username,
        id: Date.now() + Math.random()
      });
    });

    // 6. DISCONNECT
    socket.on('disconnect', () => {
      const user = socketUsers.get(socket.id);
      if (!user) return;

      const { roomCode, username } = user;
      const room = activeRooms.get(roomCode);

      if (room) {
        room.participants = room.participants.filter(p => p.socketId !== socket.id);

        if (room.hostId === socket.id && room.participants.length > 0) {
          const newHost = room.participants[0];
          room.hostId = newHost.socketId;
          room.hostName = newHost.username;
          io.to(roomCode).emit('room:new-host', {
            hostId: newHost.socketId,
            hostName: newHost.username
          });
        }
      }

      socketUsers.delete(socket.id);

      socket.to(roomCode).emit('peer:left', {
        socketId: socket.id,
        username
      });

      io.to(roomCode).emit('chat:message', {
        id: 'sys-' + Date.now(),
        type: 'system',
        text: `${username} xonani tark etdi.`,
        timestamp: new Date().toISOString()
      });
    });
  });
}

module.exports = { setupSocketIO };
