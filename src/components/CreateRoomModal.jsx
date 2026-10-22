import React, { useState } from 'react';
import { X, Sparkles, Film, ArrowRight, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function CreateRoomModal({ isOpen, onClose, videos, onRoomCreated, initialVideoId = null, initialEpisodeIndex = 0 }) {
  const [title, setTitle] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState(initialVideoId || videos[0]?.id || '');
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(initialEpisodeIndex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentAnime = videos.find(v => v.id === selectedVideoId) || videos[0];
  const episodes = currentAnime?.episodes || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const room = await api.createRoom(title, selectedVideoId, selectedEpisodeIndex);
      onRoomCreated(room.code);
      onClose();
    } catch (err) {
      setError(err.message || 'Xona yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-white/10 shadow-2xl p-6">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-pink-500 mb-3 shadow-lg shadow-violet-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">Yangi Lobby Ochish</h2>
          <p className="text-xs text-slate-400 mt-1">
            Xona yarating, kod yoki havolani do‘stlarga yuboring va birga tomosha qiling!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Xona Nomi (Ixtiyoriy)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: JoJo marafoni"
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Animeni Tanlang
            </label>
            <div className="relative">
              <select
                value={selectedVideoId}
                onChange={(e) => {
                  setSelectedVideoId(e.target.value);
                  setSelectedEpisodeIndex(0);
                }}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
              >
                {videos.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                    {v.title} {v.episodes && v.episodes.length > 1 ? `(${v.episodes.length} ta qism)` : ''}
                  </option>
                ))}
              </select>
              <Film className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Episode selector if series has multiple episodes */}
          {episodes.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Qaysi qismdan boshlamoqchisiz?
              </label>
              <div className="relative">
                <select
                  value={selectedEpisodeIndex}
                  onChange={(e) => setSelectedEpisodeIndex(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950/70 border border-pink-500/40 rounded-xl px-3.5 py-2.5 text-sm text-pink-300 focus:outline-none focus:border-pink-500 appearance-none cursor-pointer font-semibold"
                >
                  {episodes.map((ep, idx) => (
                    <option key={ep.id || idx} value={idx} className="bg-slate-900 text-white">
                      {ep.title}
                    </option>
                  ))}
                </select>
                <Layers className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400 pointer-events-none" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Lobby Ochish va Kod Olish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
