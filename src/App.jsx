import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AnimeCatalog from './components/AnimeCatalog';
import WatchRoom from './components/WatchRoom';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import UploadModal from './components/UploadModal';
import JoinModal from './components/JoinModal';
import CreateRoomModal from './components/CreateRoomModal';
import GuestJoinModal from './components/GuestJoinModal';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'room', 'admin'
  const [currentRoomCode, setCurrentRoomCode] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [pendingRoomCode, setPendingRoomCode] = useState(null);
  const [preselectedVideoId, setPreselectedVideoId] = useState(null);
  const [preselectedEpisodeIndex, setPreselectedEpisodeIndex] = useState(0);

  // 1. Initial Load: Auth check, Videos, Active Rooms, and URL Check (?room=CODE)
  useEffect(() => {
    // Check current user
    api.getMe().then((u) => {
      if (u) {
        setUser(u);
      } else {
        const savedGuest = localStorage.getItem('ani_guest_name');
        if (savedGuest) {
          setUser({
            username: savedGuest,
            avatar: localStorage.getItem('ani_guest_avatar') || `https://api.dicebear.com/7.x/adventurer/svg?seed=${savedGuest}`,
            role: 'user'
          });
        }
      }
    });

    // Load initial data
    loadCatalogAndRooms();

    // Check if user came via direct room link (?room=ANM-XXXX or ?code=XXXX)
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || params.get('code');
    if (roomParam) {
      const code = roomParam.toUpperCase();
      const savedGuest = localStorage.getItem('ani_guest_name');
      const token = localStorage.getItem('ani_token');

      if (!token && !savedGuest) {
        setPendingRoomCode(code);
        setIsGuestModalOpen(true);
      } else {
        setCurrentRoomCode(code);
        setActiveTab('room');
      }
    }
  }, []);

  const loadCatalogAndRooms = async () => {
    try {
      const [vList, rList] = await Promise.all([
        api.getVideos(),
        api.getRooms()
      ]);
      setVideos(vList);
      setActiveRooms(rList);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  // Join Room Handler
  const handleJoinRoom = (code) => {
    const token = localStorage.getItem('ani_token');
    const savedGuest = localStorage.getItem('ani_guest_name');

    if (!token && !savedGuest && !user) {
      setPendingRoomCode(code);
      setIsGuestModalOpen(true);
      return;
    }

    setCurrentRoomCode(code);
    setActiveTab('room');
    const newUrl = `${window.location.pathname}?room=${encodeURIComponent(code)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // Guest join submit
  const handleGuestJoinSubmit = ({ username, avatar }) => {
    setUser({
      username,
      avatar,
      role: 'user'
    });
    setIsGuestModalOpen(false);
    if (pendingRoomCode) {
      setCurrentRoomCode(pendingRoomCode);
      setActiveTab('room');
      const newUrl = `${window.location.pathname}?room=${encodeURIComponent(pendingRoomCode)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  // Leave Room Handler
  const handleLeaveRoom = () => {
    setCurrentRoomCode(null);
    setActiveTab('catalog');
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
    loadCatalogAndRooms();
  };

  // Create Room With Specific Video and Episode
  const handleOpenCreateWithVideo = (vidId, epIdx = 0) => {
    setPreselectedVideoId(vidId || videos[0]?.id);
    setPreselectedEpisodeIndex(epIdx);
    setIsCreateOpen(true);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    if (activeTab === 'admin') {
      setActiveTab('catalog');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* NAVBAR */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenJoin={() => setIsJoinOpen(true)}
        onOpenCreate={() => handleOpenCreateWithVideo(videos[0]?.id)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRoomCode={currentRoomCode}
        onLogout={handleLogout}
      />

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: ANIME CATALOG */}
        {activeTab === 'catalog' && (
          <AnimeCatalog
            videos={videos}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenCreateWithVideo={handleOpenCreateWithVideo}
            onJoinRoom={handleJoinRoom}
            activeRooms={activeRooms}
            user={user}
            onRefreshVideos={loadCatalogAndRooms}
          />
        )}

        {/* VIEW 2: WATCH PARTY ROOM */}
        {activeTab === 'room' && currentRoomCode && (
          <WatchRoom
            roomCode={currentRoomCode}
            user={user}
            videos={videos}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {/* VIEW 3: ADMIN PANEL */}
        {activeTab === 'admin' && (
          <AdminPanel
            user={user}
            onOpenUpload={() => setIsUploadOpen(true)}
            onRefreshAll={loadCatalogAndRooms}
          />
        )}
      </main>

      {/* FOOTER */}
      {activeTab !== 'room' && (
        <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 glass-panel">
          <p>© 2026 AniParty — Real-vaqtda do‘stlar bilan birga anime ko‘rish platformasi.</p>
          <p className="mt-1">
            WebRTC ovoz va kamera muloqoti | Sinxronlashgan yuqori sifatli audio va video player
          </p>
        </footer>
      )}

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(loggedUser) => {
          setUser(loggedUser);
          if (loggedUser.username === 'akbarali' || loggedUser.role === 'admin') {
            setActiveTab('admin');
          }
        }}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        existingAnimeList={videos}
        user={user}
        onUploadSuccess={(newVideo) => {
          loadCatalogAndRooms();
          if (window.confirm(`"${newVideo.title}" yuklandi! Shu zahoti u bilan yangi xona ochasizmi?`)) {
            handleOpenCreateWithVideo(newVideo.id, 0);
          }
        }}
      />

      <JoinModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRoom={handleJoinRoom}
      />

      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        videos={videos}
        initialVideoId={preselectedVideoId}
        initialEpisodeIndex={preselectedEpisodeIndex}
        onRoomCreated={(code) => {
          handleJoinRoom(code);
        }}
      />

      <GuestJoinModal
        isOpen={isGuestModalOpen}
        roomCode={pendingRoomCode}
        onJoinWithGuestName={handleGuestJoinSubmit}
      />
    </div>
  );
}
