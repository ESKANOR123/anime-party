import React from 'react';
import { Film, PlusCircle, LogIn, LogOut, ShieldAlert, Sparkles, KeyRound, Tv } from 'lucide-react';

export default function Navbar({
  user,
  onOpenAuth,
  onOpenUpload,
  onOpenJoin,
  onOpenCreate,
  activeTab,
  setActiveTab,
  currentRoomCode,
  onLogout
}) {
  const isAdmin = user && (user.role === 'admin' || user.username === 'akbarali');

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* LOGO */}
        <div 
          onClick={() => setActiveTab('catalog')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-xl font-bold tracking-tight text-white group-hover:text-pink-400 transition-colors">
                AniParty
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Do‘stlar bilan anime tomosha qilish</p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-white/10 text-white shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-4 h-4 text-pink-400" />
            Anime Katalogi
          </button>

          <button
            onClick={onOpenCreate}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            Xona Yaratish
          </button>

          <button
            onClick={onOpenJoin}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-cyan-400" />
            Kod Bilan Kirish
          </button>

          {/* Anime Yuklash (Faqat Admin uchun) */}
          {isAdmin && (
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Anime Yuklash
            </button>
          )}

          {/* ADMIN LINK (Visible for akbarali) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              Admin Panel
            </button>
          )}
        </nav>

        {/* RIGHT SIDE USER / AUTH */}
        <div className="flex items-center gap-3">
          {currentRoomCode && (
            <button
              onClick={() => setActiveTab('room')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Xonaga qaytish ({currentRoomCode})
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-pink-500/40 bg-slate-800"
                />
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white leading-tight">
                      {user.username}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 text-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isAdmin ? 'Tizim Boshqaruvchisi' : 'Anime Muxlisi'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Chiqish"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 transition-all shadow-md shadow-pink-500/20 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Kirish / Ro‘yxatdan o‘tish
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
