import React, { useState } from 'react';
import { Play, Users, Trash2, Search, Plus, Sparkles, Tv, Layers, X, Film, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AnimeCatalog({
  videos,
  onOpenUpload,
  onOpenCreateWithVideo,
  onJoinRoom,
  activeRooms,
  user,
  onRefreshVideos
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [viewingEpisodesAnime, setViewingEpisodesAnime] = useState(null);

  const isAdmin = user && (user.role === 'admin' || user.username === 'akbarali');

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Haqiqatan ham bu animeni o‘chirmoqchimisiz?')) return;
    try {
      setDeletingId(id);
      await api.deleteVideo(id);
      if (onRefreshVideos) onRefreshVideos();
    } catch (err) {
      alert(err.message || 'O‘chirishda xatolik yuz berdi');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 text-pink-400 text-xs font-bold border border-pink-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Ko‘p Qismli Animelar & Watch Party
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Do‘stlar Bilan <span className="text-gradient">Real-Vaqtda</span> Anime Tomosha Qiling
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            JoJo yoki istalgan sevimli animelaringizning barcha qismlarini yuklang, lobby oching va do‘stlar bilan birgalikda to‘liq sinxronlangan holda kamera va ovozli muloqotda ko‘ring!
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenCreateWithVideo(videos[0]?.id, 0)}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 text-white hover:scale-102 transition-transform shadow-xl shadow-pink-500/25 flex items-center gap-2.5"
            >
              <Users className="w-4 h-4" />
              Lobby Ochish
            </button>
            {isAdmin && (
              <button
                onClick={onOpenUpload}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Anime Yuklash (Faqat Admin)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE PUBLIC LOBBIES SECTION */}
      {activeRooms && activeRooms.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                Jonli Lobbylar (Faol Xonalar)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {activeRooms.length} ta faol xona
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRooms.map((room) => (
              <div
                key={room.code}
                className="glass-card rounded-2xl p-4 border border-pink-500/30 flex items-center justify-between gap-4 group hover:border-pink-500 transition-all"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 shrink-0 overflow-hidden relative">
                    {room.videoThumbnail ? (
                      <img src={room.videoThumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Tv className="w-6 h-6 text-slate-500 absolute inset-0 m-auto" />
                    )}
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm font-bold text-white truncate">{room.title}</h3>
                    <p className="text-xs text-slate-400 truncate">Egasi: {room.hostName}</p>
                    <span className="text-[10px] text-pink-400 font-mono font-bold">Kod: {room.code}</span>
                  </div>
                </div>

                <button
                  onClick={() => onJoinRoom(room.code)}
                  className="px-3.5 py-2 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Qo‘shilish ({room.participantsCount})
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CATALOG SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-pink-400" />
              Anime Kolleksiyasi
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Istalgan animeni tanlang, qismlarini ko‘ring va do‘stlar bilan birga tomosha qiling
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Animeni qidirish..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const canDelete = isAdmin || (user && user.id === video.uploaderId);
            const totalEpisodes = video.episodes ? video.episodes.length : 1;
            const isSeries = video.isSeries || totalEpisodes > 1;

            return (
              <div
                key={video.id}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col group relative"
              >
                {/* Thumbnail Image */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={video.thumbnail || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                  {/* Series or Episode Badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg backdrop-blur-md text-white text-[11px] font-bold shadow-md flex items-center gap-1 ${
                    isSeries ? 'bg-violet-600/90' : 'bg-pink-500/90'
                  }`}>
                    {isSeries ? (
                      <>
                        <Layers className="w-3 h-3" />
                        <span>Serial: {totalEpisodes} ta qism</span>
                      </>
                    ) : (
                      <span>{video.episode || 'Film'}</span>
                    )}
                  </span>

                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      onClick={(e) => handleDelete(video.id, e)}
                      disabled={deletingId === video.id}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-slate-300 hover:text-white transition-colors"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-white group-hover:text-pink-400 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {video.description || 'Do‘stlar bilan birga tomosha qilish uchun ajoyib anime.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    {/* View Episodes list button if series */}
                    {isSeries ? (
                      <button
                        onClick={() => setViewingEpisodesAnime(video)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-pink-400" />
                        <span>Qismlar ({totalEpisodes})</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                        <span className="text-slate-500">Yuklovchi:</span>
                        <span className="text-slate-300 font-bold">{video.uploader || 'Admin'}</span>
                      </div>
                    )}

                    <button
                      onClick={() => onOpenCreateWithVideo(video.id, 0)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-md shadow-pink-500/20 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Lobby Ochish
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* EPISODES LIST MODAL */}
      {viewingEpisodesAnime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-2xl border border-white/10 p-6 max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  {viewingEpisodesAnime.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Barcha qismlar ro‘yxati ({viewingEpisodesAnime.episodes?.length || 1} ta qism)
                </p>
              </div>
              <button
                onClick={() => setViewingEpisodesAnime(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(viewingEpisodesAnime.episodes || []).map((ep, idx) => (
                <div
                  key={ep.id || idx}
                  className="p-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-pink-500 flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white group-hover:text-pink-300 truncate">
                        {ep.title}
                      </h4>
                      <span className="text-[10px] text-slate-500">Davomiyligi: {ep.duration || '24:00'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setViewingEpisodesAnime(null);
                      onOpenCreateWithVideo(viewingEpisodesAnime.id, idx);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Shu qismdan ko‘rish
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
