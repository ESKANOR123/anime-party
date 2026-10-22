import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Copy, Check, Users,
  Mic, MicOff, Video, VideoOff, Send, Smile, RefreshCw, Film,
  LogOut, Shield, Radio, Volume1, SkipForward, SkipBack, Layers,
  ChevronDown
} from 'lucide-react';
import { socketService } from '../services/socket';
import { WebRTCManager } from '../services/webrtc';
import InviteModal from './InviteModal';

export default function WatchRoom({ roomCode, user, onLeaveRoom, videos }) {
  // State
  const [room, setRoom] = useState(null);
  const [peers, setPeers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [animeVolume, setAnimeVolume] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAnimeSelector, setShowAnimeSelector] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Sinxronlangan');

  // Multi-Episode Series State
  const [currentAnime, setCurrentAnime] = useState(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  // Media Controls (Self)
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [selfSpeaking, setSelfSpeaking] = useState(false);

  // Chat & Reactions
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);

  // Refs
  const videoRef = useRef(null);
  const localVideoRef = useRef(null);
  const webrtcRef = useRef(null);
  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);

  const currentUsername = user ? user.username : 'Mehmon_' + Math.floor(Math.random() * 900 + 100);
  const currentAvatar = user ? user.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUsername}`;

  // 1. Initialize WebRTC and Socket.IO
  useEffect(() => {
    const socket = socketService.getSocket();
    socketRef.current = socket;

    const webrtc = new WebRTCManager({
      socket,
      onRemoteStream: (peerSocketId, stream) => {
        setPeers(prev => prev.map(p => {
          if (p.socketId === peerSocketId) {
            return { ...p, stream };
          }
          return p;
        }));
      },
      onPeerLeft: (peerSocketId) => {
        setPeers(prev => prev.filter(p => p.socketId !== peerSocketId));
      },
      onSpeakingChange: (id, isSpeaking) => {
        if (id === 'local') {
          setSelfSpeaking(isSpeaking);
        } else {
          setPeers(prev => prev.map(p => {
            if (p.socketId === id) {
              return { ...p, isSpeaking };
            }
            return p;
          }));
        }
      }
    });
    webrtcRef.current = webrtc;

    webrtc.startLocalMedia({ video: true, audio: true }).then(stream => {
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    socket.emit('room:join', {
      roomCode,
      username: currentUsername,
      avatar: currentAvatar,
      isCameraOn: true,
      isMicOn: true
    });

    socket.on('room:joined', ({ room: joinedRoom, peers: existingPeers, self }) => {
      setRoom(joinedRoom);
      setIsHost(self.isHost);
      setCurrentAnime(joinedRoom.currentAnime);
      setCurrentEpisodeIndex(joinedRoom.currentEpisodeIndex || 0);
      setPeers(existingPeers.map(p => ({ ...p, stream: null, isSpeaking: false })));

      existingPeers.forEach(peer => {
        webrtc.callPeer(peer.socketId);
      });
    });

    socket.on('peer:joined', (newPeer) => {
      setPeers(prev => {
        if (prev.some(p => p.socketId === newPeer.socketId)) return prev;
        return [...prev, { ...newPeer, stream: null, isSpeaking: false }];
      });
    });

    socket.on('peer:left', ({ socketId }) => {
      webrtc.closePeer(socketId);
      setPeers(prev => prev.filter(p => p.socketId !== socketId));
    });

    socket.on('room:new-host', ({ hostId, hostName }) => {
      if (socket.id === hostId) {
        setIsHost(true);
      }
      setRoom(prev => prev ? { ...prev, hostId, hostName } : null);
    });

    socket.on('peer:media-toggled', ({ socketId, type, enabled }) => {
      setPeers(prev => prev.map(p => {
        if (p.socketId === socketId) {
          if (type === 'camera') return { ...p, isCameraOn: enabled };
          if (type === 'mic') return { ...p, isMicOn: enabled };
        }
        return p;
      }));
    });

    socket.on('webrtc:offer', ({ fromSocketId, offer }) => {
      webrtc.handleOffer(fromSocketId, offer);
    });

    socket.on('webrtc:answer', ({ fromSocketId, answer }) => {
      webrtc.handleAnswer(fromSocketId, answer);
    });

    socket.on('webrtc:ice-candidate', ({ fromSocketId, candidate }) => {
      webrtc.handleCandidate(fromSocketId, candidate);
    });

    // Video Synchronization
    socket.on('video:play', ({ currentTime }) => {
      if (videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - currentTime) > 0.4) {
          videoRef.current.currentTime = currentTime;
        }
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    });

    socket.on('video:pause', ({ currentTime }) => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.pause();
        setIsPlaying(false);
      }
    });

    socket.on('video:seek', ({ currentTime }) => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    });

    socket.on('video:sync-tick', ({ currentTime, isPlaying: hostPlaying }) => {
      if (videoRef.current && !isHost) {
        const diff = Math.abs(videoRef.current.currentTime - currentTime);
        if (diff > 0.8) {
          videoRef.current.currentTime = currentTime;
          setSyncStatus('Sinxronlandi');
        }
        if (hostPlaying && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (!hostPlaying && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    });

    // Entire Anime Changed
    socket.on('video:change', ({ currentAnime: anime, currentEpisodeIndex: epIdx, video }) => {
      setCurrentAnime(anime);
      setCurrentEpisodeIndex(epIdx || 0);
      setRoom(prev => prev ? { ...prev, currentAnime: anime, currentVideo: video } : null);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    });

    // Episode Switched inside Series
    socket.on('video:change-episode', ({ episodeIndex, video }) => {
      setCurrentEpisodeIndex(episodeIndex);
      setRoom(prev => prev ? { ...prev, currentVideo: video } : null);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    });

    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('reaction:receive', ({ emoji }) => {
      const id = Date.now() + Math.random();
      const x = Math.floor(Math.random() * 80) + 10;
      setReactions(prev => [...prev, { id, emoji, x }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    });

    return () => {
      webrtc.destroy();
      socket.off('room:joined');
      socket.off('peer:joined');
      socket.off('peer:left');
      socket.off('room:new-host');
      socket.off('peer:media-toggled');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('video:play');
      socket.off('video:pause');
      socket.off('video:seek');
      socket.off('video:sync-tick');
      socket.off('video:change');
      socket.off('video:change-episode');
      socket.off('chat:message');
      socket.off('reaction:receive');
    };
  }, [roomCode]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Host sync tick timer
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      if (videoRef.current && socketRef.current) {
        socketRef.current.emit('video:sync-tick', {
          currentTime: videoRef.current.currentTime,
          isPlaying: !videoRef.current.paused
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isHost]);

  // Video Controls
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        socketRef.current?.emit('video:play', {
          currentTime: videoRef.current.currentTime
        });
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      socketRef.current?.emit('video:pause', {
        currentTime: videoRef.current.currentTime
      });
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setVideoCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      socketRef.current?.emit('video:seek', { currentTime: newTime });
    }
  };

  const handleAnimeVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAnimeVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  // Switch to specific episode
  const handleSelectEpisode = (epIdx) => {
    socketRef.current?.emit('video:change-episode', { episodeIndex: epIdx });
    setShowEpisodeDrawer(false);
  };

  // Next / Prev Episode Handlers
  const handleNextEpisode = () => {
    const total = currentAnime?.episodes?.length || 1;
    if (currentEpisodeIndex < total - 1) {
      handleSelectEpisode(currentEpisodeIndex + 1);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      handleSelectEpisode(currentEpisodeIndex - 1);
    }
  };

  // Auto next episode when current video ends
  const handleVideoEnded = () => {
    setIsPlaying(false);
    const total = currentAnime?.episodes?.length || 1;
    if (isHost && currentEpisodeIndex < total - 1) {
      // Auto move to next episode after 3 seconds
      setTimeout(() => {
        handleNextEpisode();
      }, 2500);
    }
  };

  // Toggle Camera & Mic
  const handleToggleCamera = () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    webrtcRef.current?.toggleCamera(nextState);
    socketRef.current?.emit('media:toggle', { type: 'camera', enabled: nextState });
  };

  const handleToggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    webrtcRef.current?.toggleMic(nextState);
    socketRef.current?.emit('media:toggle', { type: 'mic', enabled: nextState });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit('chat:send', { text: chatInput });
    setChatInput('');
  };

  const handleSendReaction = (emoji) => {
    socketRef.current?.emit('reaction:send', { emoji });
  };

  const handleChangeAnime = (vid) => {
    socketRef.current?.emit('video:change', { video: vid, episodeIndex: 0 });
    setShowAnimeSelector(false);
  };

  const currentVideo = room?.currentVideo;
  const episodesList = currentAnime?.episodes || [];
  const hasMultipleEpisodes = episodesList.length > 1;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-7xl mx-auto p-2 sm:p-4 gap-3">
      
      {/* ROOM TOP HEADER */}
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm sm:text-base font-bold text-white leading-tight">
                {room?.title || 'Anime Xonasi'}
              </h2>
              {isHost && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black text-[10px] font-black uppercase tracking-wider">
                  XONA EGASI
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-md">
              <span className="text-white font-bold">{currentAnime?.title || currentVideo?.title}</span>
              {currentVideo?.episodeTitle && (
                <span className="text-pink-400 font-semibold ml-1.5">
                  • {currentVideo.episodeTitle}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Room Code & Link Share Bar */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Multi-Episode Series Switcher Dropdown */}
          {hasMultipleEpisodes && (
            <button
              onClick={() => setShowEpisodeDrawer(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-pink-600/30 border border-pink-500/40 text-xs font-bold text-pink-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              title="Qismlar ro‘yxatini ochish"
            >
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>
                Qism: {currentEpisodeIndex + 1} / {episodesList.length}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          )}

          {/* Invite Friends Button (QR Code + Links) */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-xs font-bold text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-pink-500/20"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Do‘stlarni Taklif Qilish</span>
          </button>

          {/* Room Code Pill */}
          <button
            onClick={copyRoomCode}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono font-bold text-cyan-400 hover:border-cyan-500 transition-colors flex items-center gap-1.5"
            title="Xona kodini nusxalash"
          >
            <span>Kod: <strong>{roomCode}</strong></span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Share Link Button */}
          <button
            onClick={copyRoomLink}
            className="px-3 py-1.5 rounded-xl bg-pink-500/20 border border-pink-500/40 text-xs font-bold text-pink-300 hover:bg-pink-500 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Havola nusxalandi!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Havolani nusxalash</span>
              </>
            )}
          </button>

          {/* Change Anime (Host only) */}
          {isHost && (
            <button
              onClick={() => setShowAnimeSelector(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-600/30 border border-violet-500/40 text-xs font-bold text-violet-300 hover:bg-violet-600 hover:text-white transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Animeni o‘zgartirish
            </button>
          )}

          {/* Leave Room Button */}
          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 transition-colors"
            title="Xonadan chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN PLAYSPACE: VIDEO + WEBRTC CAMS + CHAT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
        
        {/* VIDEO & WEBRTC AREA (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          
          {/* VIDEO PLAYER THEATER */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 flex-1 min-h-[300px] flex items-center justify-center shadow-2xl group">
            
            {/* FLOATING EMOJI REACTIONS */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className="floating-emoji text-3xl"
                  style={{ left: `${r.x}%`, bottom: '20%' }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* SYNC STATUS & EPISODE BADGE */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {syncStatus}
              </div>

              {hasMultipleEpisodes && (
                <div className="px-2.5 py-1 rounded-full bg-pink-500/80 backdrop-blur-md text-white text-[11px] font-bold">
                  {currentEpisodeIndex + 1}-Qism / {episodesList.length}
                </div>
              )}
            </div>

            {/* VIDEO ELEMENT */}
            {currentVideo ? (
              <video
                ref={videoRef}
                src={currentVideo.url}
                playsInline
                crossOrigin="anonymous"
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setVideoCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setVideoDuration(videoRef.current.duration || 0);
                    videoRef.current.volume = animeVolume;
                  }
                }}
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain cursor-pointer"
                onClick={handlePlayPause}
              />
            ) : (
              <div className="text-center p-8">
                <Film className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-bounce" />
                <p className="text-sm text-slate-400">Hozircha anime tanlanmagan</p>
                {isHost && (
                  <button
                    onClick={() => setShowAnimeSelector(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-pink-500 text-xs font-bold text-white hover:bg-pink-600"
                  >
                    Anime Tanlash
                  </button>
                )}
              </div>
            )}

            {/* CUSTOM VIDEO CONTROLS BAR */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-95 transition-opacity">
              
              {/* Scrubbing timeline */}
              <input
                type="range"
                min="0"
                max={videoDuration || 100}
                step="0.1"
                value={videoCurrentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer mb-2 accent-pink-500"
              />

              <div className="flex items-center justify-between gap-3 text-white text-xs">
                <div className="flex items-center gap-2 sm:gap-3">
                  
                  {/* Previous Episode Button */}
                  {hasMultipleEpisodes && isHost && (
                    <button
                      onClick={handlePrevEpisode}
                      disabled={currentEpisodeIndex === 0}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Oldingi qism"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                  )}

                  {/* Play / Pause button */}
                  <button
                    onClick={handlePlayPause}
                    className="w-8 h-8 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center transition-all shadow-md shadow-pink-500/30"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  {/* Next Episode Button */}
                  {hasMultipleEpisodes && isHost && (
                    <button
                      onClick={handleNextEpisode}
                      disabled={currentEpisodeIndex >= episodesList.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Keyingi qism"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  )}

                  {/* Time indicator */}
                  <span className="font-mono text-[11px] text-slate-300 hidden sm:inline">
                    {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                  </span>

                  {/* HQ Anime Audio Volume */}
                  <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
                    <Volume2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={animeVolume}
                      onChange={handleAnimeVolumeChange}
                      className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      title="Anime ovozini sozlash (HQ Audio)"
                    />
                    <span className="text-[10px] text-pink-300 font-bold">{Math.round(animeVolume * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Episode List Trigger */}
                  {hasMultipleEpisodes && (
                    <button
                      onClick={() => setShowEpisodeDrawer(true)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-pink-400" />
                      <span className="hidden sm:inline">Qismlar ro‘yxati</span>
                    </button>
                  )}

                  <button
                    onClick={handleFullscreen}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="To‘liq ekran"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* WEBRTC CAMERA & VOICE GRID + CONTROLS (BOTTOM DOCK) */}
          <div className="glass-panel rounded-2xl p-3 border border-white/10 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">
                  Jonli Ishtirokchilar ({peers.length + 1})
                </span>
              </div>

              {/* Media Controls Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleCamera}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isCameraOn
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                  }`}
                >
                  {isCameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  <span>{isCameraOn ? 'Kamera Yoqilgan' : 'Kamera O‘chirilgan'}</span>
                </button>

                <button
                  onClick={handleToggleMic}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isMicOn
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                  }`}
                >
                  {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span>{isMicOn ? 'Mikrofon Ochiq' : 'Mute'}</span>
                </button>
              </div>
            </div>

            {/* Video Tiles Grid */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1">
              
              {/* LOCAL USER TILE */}
              <div
                className={`relative w-36 h-24 sm:w-44 sm:h-28 rounded-xl bg-slate-950 border overflow-hidden shrink-0 transition-all ${
                  selfSpeaking ? 'speaking-pulse border-emerald-400' : 'border-white/10'
                }`}
              >
                {isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 p-2">
                    <img src={currentAvatar} alt="" className="w-9 h-9 rounded-full mb-1 border border-pink-500/40" />
                    <span className="text-[10px] text-slate-400 font-semibold">Kamera o‘chiq</span>
                  </div>
                )}

                <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm flex items-center justify-between text-[10px]">
                  <span className="text-white font-bold truncate">Siz ({currentUsername})</span>
                  {isMicOn ? <Mic className="w-3 h-3 text-emerald-400 shrink-0" /> : <MicOff className="w-3 h-3 text-rose-400 shrink-0" />}
                </div>
              </div>

              {/* PEERS TILES */}
              {peers.map((peer) => (
                <PeerVideoTile key={peer.socketId} peer={peer} />
              ))}

              {peers.length === 0 && (
                <div className="text-xs text-slate-500 italic py-6 px-4">
                  Hozircha do‘stlar qo‘shilmadi. Yuqoridagi kod yoki havolani yuboring!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CHAT & EMOJI REACTIONS (1 Col Sidebar) */}
        <div className="lg:col-span-1 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden min-h-[300px]">
          
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              Jonli Chat
            </h3>
            <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">
              Real-time
            </span>
          </div>

          <div className="px-3 py-2 border-b border-white/5 bg-slate-950/40 flex items-center justify-around">
            {['🔥', '❤️', '😂', '🍿', '😱', '👏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="text-lg hover:scale-130 active:scale-95 transition-transform"
                title={`${emoji} reaksiyasi`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="text-center my-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] text-slate-400 font-medium">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isMe = msg.username === currentUsername;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {!isMe && (
                      <img src={msg.avatar} alt="" className="w-3.5 h-3.5 rounded-full" />
                    )}
                    <span className="text-[10px] font-bold text-slate-400">
                      {isMe ? 'Siz' : msg.username}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words ${
                      isMe
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-200 border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-2 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Xabar yozing..."
              className="flex-1 bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* EPISODES DRAWER MODAL (Multi-Episode Series Switcher) */}
      {showEpisodeDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel rounded-2xl border border-white/10 p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Qismlar Ro‘yxati
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{currentAnime?.title}</p>
              </div>
              <button
                onClick={() => setShowEpisodeDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {episodesList.map((ep, idx) => {
                const isCurrent = idx === currentEpisodeIndex;

                return (
                  <div
                    key={ep.id || idx}
                    onClick={() => {
                      if (isHost) {
                        handleSelectEpisode(idx);
                      } else {
                        alert('Faqatgina xona egasi qismni almashtirishi mumkin!');
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCurrent ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold truncate">{ep.title}</h4>
                        <span className="text-[10px] text-slate-500">{ep.duration || '24:00'}</span>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/30 px-2 py-0.5 rounded-full shrink-0">
                        Hozirgi
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {!isHost && (
              <p className="text-[11px] text-slate-500 italic mt-3 text-center">
                (Qismlarni faqat xona egasi almashtira oladi)
              </p>
            )}
          </div>
        </div>
      )}

      {/* ANIME SELECTOR MODAL FOR HOST */}
      {showAnimeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel rounded-2xl border border-white/10 p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="font-heading text-lg font-bold text-white">
                Animeni Almashtirish
              </h3>
              <button
                onClick={() => setShowAnimeSelector(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {videos.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleChangeAnime(v)}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500 cursor-pointer flex items-center gap-3 transition-all"
                >
                  <img src={v.thumbnail} alt="" className="w-16 h-11 object-cover rounded-lg shrink-0 bg-slate-800" />
                  <div className="flex-1 truncate">
                    <h4 className="text-sm font-bold text-white truncate">{v.title}</h4>
                    <p className="text-xs text-slate-400">
                      {v.isSeries || (v.episodes && v.episodes.length > 1)
                        ? `Ko‘p qismli: ${v.episodes?.length || 1} ta qism`
                        : v.episode || '1-Qism'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INVITE FRIENDS MODAL */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomCode={roomCode}
        roomTitle={room?.title}
      />
    </div>
  );
}

function PeerVideoTile({ peer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div
      className={`relative w-36 h-24 sm:w-44 sm:h-28 rounded-xl bg-slate-950 border overflow-hidden shrink-0 transition-all ${
        peer.isSpeaking ? 'speaking-pulse border-emerald-400' : 'border-white/10'
      }`}
    >
      {peer.isCameraOn && peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 p-2">
          <img src={peer.avatar} alt="" className="w-9 h-9 rounded-full mb-1 border border-cyan-500/40" />
          <span className="text-[10px] text-slate-400 font-semibold">{peer.username}</span>
        </div>
      )}

      {peer.stream && (
        <audio
          autoPlay
          ref={(el) => {
            if (el && el.srcObject !== peer.stream) {
              el.srcObject = peer.stream;
            }
          }}
        />
      )}

      <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm flex items-center justify-between text-[10px]">
        <span className="text-white font-bold truncate">{peer.username}</span>
        {peer.isMicOn ? (
          <Mic className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : (
          <MicOff className="w-3 h-3 text-rose-400 shrink-0" />
        )}
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
