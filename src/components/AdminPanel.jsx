import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Users, Film, Radio, HardDrive, Trash2,
  CheckCircle2, RefreshCw, UserCheck, Eye, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminPanel({ user, onOpenUpload, onRefreshAll }) {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [videosList, setVideosList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'videos', 'rooms'
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, us, rm, vd] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminRooms(),
        api.getVideos()
      ]);
      setStats(st);
      setUsersList(us);
      setRoomsList(rm);
      setVideosList(vd);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (id, uname) => {
    if (!window.confirm(`Haqiqatan ham "${uname}" foydalanuvchisini o‘chirmoqchimisiz?`)) return;
    try {
      await api.deleteAdminUser(id);
      setActionMessage(`"${uname}" foydalanuvchisi o‘chirildi`);
      loadData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.updateAdminUserRole(id, newRole);
      setActionMessage(`Foydalanuvchi roli ${newRole} ga o‘zgartirildi`);
      loadData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleDeleteVideo = async (id, title) => {
    if (!window.confirm(`"${title}" videosini butunlay o‘chirib tashlamoqchimisiz?`)) return;
    try {
      await api.deleteVideo(id);
      setActionMessage(`"${title}" videosi o‘chirildi`);
      loadData();
      if (onRefreshAll) onRefreshAll();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleForceCloseRoom = async (code) => {
    if (!window.confirm(`Xona ${code} ni majburan yopmoqchimisiz?`)) return;
    try {
      await api.forceCloseRoom(code);
      setActionMessage(`Xona ${code} muvaffaqiyatli yopildi`);
      loadData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      
      {/* ADMIN HEADER */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  Bosh Boshqaruv Paneli
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black text-xs font-black uppercase tracking-wider">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Admin: <strong className="text-rose-400 font-bold">{user?.username}</strong> — Tizim to‘liq sizning nazoratingizda!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Yangilash
            </button>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 flex items-center gap-2"
            >
              <Film className="w-3.5 h-3.5" />
              Anime Yuklash
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionMessage}
          </div>
        )}
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Users */}
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Foydalanuvchilar</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-heading">
            {stats?.totalUsers || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Ro‘yxatdan o‘tganlar</p>
        </div>

        {/* Total Videos */}
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Anime Videolar</span>
            <Film className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-heading">
            {stats?.totalVideos || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Katalogda mavjud</p>
        </div>

        {/* Active Rooms */}
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Faol Lobbylar</span>
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-heading">
            {stats?.activeRoomsCount || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Hozir ochiq xonalar</p>
        </div>

        {/* Live Participants */}
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Jonli Tomoshabinlar</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-heading">
            {stats?.liveParticipants || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Xonalardagi do‘stlar</p>
        </div>

        {/* Storage */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Server Xotirasi</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-heading">
            {stats?.storageMB || '0.00'} MB
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Diskda egallangan joy</p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex rounded-2xl bg-slate-900/80 p-1.5 border border-white/10 max-w-xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Foydalanuvchilar ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'videos' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Anime Videolar ({videosList.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rooms' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Jonli Lobbylar ({roomsList.length})
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'overview' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-400" />
              Barcha Ro‘yxatdan O‘tgan Foydalanuvchilar
            </h3>
            <span className="text-xs text-slate-400">Jami: {usersList.length} ta hisob</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                  <th className="p-3.5">Foydalanuvchi</th>
                  <th className="p-3.5">Rol</th>
                  <th className="p-3.5">Ro‘yxatdan o‘tgan sana</th>
                  <th className="p-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.map((u) => {
                  const isAkbarali = u.username.toLowerCase() === 'akbarali';

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={u.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-800" />
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            {u.username}
                            {isAkbarali && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 rounded">
                                Bosh Admin
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-500">ID: {u.id.slice(0, 12)}...</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        {!isAkbarali && (
                          <>
                            <button
                              onClick={() => handleChangeRole(u.id, u.role)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                              title="Rolni o‘zgartirish"
                            >
                              {u.role === 'admin' ? 'User qilish' : 'Admin qilish'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                              title="O‘chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isAkbarali && (
                          <span className="text-[11px] text-slate-500 italic">Himoyalangan</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VIDEOS MANAGEMENT */}
      {activeTab === 'videos' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-pink-400" />
              Anime Katalogini Boshqarish
            </h3>
            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition-colors"
            >
              + Yangi Anime Qo‘shish
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                  <th className="p-3.5">Anime</th>
                  <th className="p-3.5">Qism</th>
                  <th className="p-3.5">Yuklovchi</th>
                  <th className="p-3.5">Ko‘rishlar</th>
                  <th className="p-3.5 text-right">O‘chirish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {videosList.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <img src={v.thumbnail} alt="" className="w-12 h-8 rounded-lg object-cover bg-slate-800" />
                      <div>
                        <p className="font-bold text-white line-clamp-1">{v.title}</p>
                        <span className="text-[10px] text-slate-500">ID: {v.id}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-semibold">{v.episode || '1-Qism'}</td>
                    <td className="p-3.5 text-slate-400">{v.uploader || 'Admin'}</td>
                    <td className="p-3.5 text-pink-400 font-bold">{v.views || 0} marta</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteVideo(v.id, v.title)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE ROOMS MONITOR */}
      {activeTab === 'rooms' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              Hozirgi Jonli Lobbylar (Real-time Monitor)
            </h3>
            <span className="text-xs text-slate-400">Jami: {roomsList.length} ta xona</span>
          </div>

          {roomsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                    <th className="p-3.5">Xona Nomi / Kod</th>
                    <th className="p-3.5">Xona Egasi (Host)</th>
                    <th className="p-3.5">Ko‘rilayotgan Anime</th>
                    <th className="p-3.5">Ishtirokchilar</th>
                    <th className="p-3.5 text-right">Majburan Yopish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {roomsList.map((r) => (
                    <tr key={r.code} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-white">{r.title}</p>
                        <span className="text-[11px] font-mono text-cyan-400 font-bold">Kod: {r.code}</span>
                      </td>
                      <td className="p-3.5 text-slate-300 font-semibold">{r.hostName}</td>
                      <td className="p-3.5 text-pink-300 font-bold">{r.videoTitle}</td>
                      <td className="p-3.5 text-emerald-400 font-bold">
                        {r.participants ? r.participants.length : 0} kishi
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleForceCloseRoom(r.code)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all"
                        >
                          Xonani Yopish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              Hozirda hech qanday ochiq lobby yo‘q.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
