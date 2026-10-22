const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../db');
const { optionalAuth } = require('../auth');

// Generate 6-char alphanumeric room code, e.g. "ANM-8291"
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ANM-${randomPart}`;
}

const activeRooms = new Map();

function getActiveRoomsMap() {
  return activeRooms;
}

// POST /api/rooms/create - Create a new lobby (supports specific episode)
router.post('/create', optionalAuth, (req, res) => {
  try {
    const { title, videoId, episodeIndex = 0, customCode } = req.body;
    const db = getDb();

    let code = customCode ? customCode.trim().toUpperCase() : generateRoomCode();
    
    if (activeRooms.has(code)) {
      code = generateRoomCode();
    }

    const anime = db.videos.find(v => v.id === videoId) || db.videos[0] || null;
    const epIdx = Math.max(0, parseInt(episodeIndex, 10) || 0);

    const episode = (anime && anime.episodes && anime.episodes[epIdx])
      ? anime.episodes[epIdx]
      : (anime?.episodes?.[0] || null);

    const hostName = req.user ? req.user.username : (req.body.hostName || 'Xona Egasi');
    const hostId = req.user ? req.user.id : uuidv4();

    const videoObj = episode ? {
      title: `${anime.title} — ${episode.title}`,
      episodeTitle: episode.title,
      episodeNumber: episode.episodeNumber,
      url: episode.url,
      thumbnail: anime.thumbnail
    } : null;

    const roomData = {
      id: uuidv4(),
      code,
      title: title ? title.trim() : `${hostName}ning Anime Lobbysi`,
      hostId,
      hostName,
      hostAvatar: req.user ? req.user.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${hostName}`,
      currentAnime: anime,
      currentEpisodeIndex: epIdx,
      currentVideo: videoObj,
      currentTime: 0,
      isPlaying: false,
      playbackRate: 1,
      createdAt: new Date().toISOString(),
      participants: []
    };

    activeRooms.set(code, roomData);

    res.status(201).json({
      success: true,
      message: 'Lobby muvaffaqiyatli yaratildi!',
      room: roomData
    });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ success: false, message: 'Lobby yaratishda xatolik yuz berdi' });
  }
});

// GET /api/rooms/:code - Validate and get room information
router.get('/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const room = activeRooms.get(code);

  if (!room) {
    return res.status(404).json({ success: false, message: 'Bunday kodli xona (lobby) topilmadi yoki u yopilgan' });
  }

  res.json({
    success: true,
    room: {
      id: room.id,
      code: room.code,
      title: room.title,
      hostId: room.hostId,
      hostName: room.hostName,
      currentAnime: room.currentAnime,
      currentEpisodeIndex: room.currentEpisodeIndex,
      currentVideo: room.currentVideo,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      participantsCount: room.participants ? room.participants.length : 0,
      createdAt: room.createdAt
    }
  });
});

// GET /api/rooms - List all active public lobbies
router.get('/', (req, res) => {
  const roomsList = [];
  activeRooms.forEach((room) => {
    roomsList.push({
      id: room.id,
      code: room.code,
      title: room.title,
      hostName: room.hostName,
      videoTitle: room.currentVideo ? room.currentVideo.title : 'Tanlanmagan',
      videoThumbnail: room.currentVideo ? room.currentVideo.thumbnail : null,
      participantsCount: room.participants ? room.participants.length : 0,
      createdAt: room.createdAt
    });
  });

  res.json({
    success: true,
    rooms: roomsList
  });
});

module.exports = {
  router,
  activeRooms,
  getActiveRoomsMap
};
