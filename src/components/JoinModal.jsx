import React, { useState } from 'react';
import { X, KeyRound, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function JoinModal({ isOpen, onClose, onJoinRoom }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');

    let cleanedCode = code.trim().toUpperCase();
    if (cleanedCode.includes('ROOM=')) {
      cleanedCode = cleanedCode.split('ROOM=')[1].split('&')[0];
    } else if (cleanedCode.includes('/ROOM/')) {
      cleanedCode = cleanedCode.split('/ROOM/')[1].split('?')[0];
    }

    if (!cleanedCode) {
      setError('Xona kodi yoki havolasini kiriting');
      return;
    }

    setLoading(true);
    try {
      const room = await api.getRoom(cleanedCode);
      onJoinRoom(room.code);
      onClose();
    } catch (err) {
      setError(err.message || 'Xona topilmadi');
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 mb-3 shadow-lg shadow-cyan-500/25">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">Xonaga Qo‘shilish</h2>
          <p className="text-xs text-slate-400 mt-1">
            Do‘stingiz yuborgan xona kodi yoki havolani kiriting
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Xona Kodi yoki Havolasi
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Masalan: ANM-7842"
              required
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3 text-base font-mono tracking-wider uppercase text-center text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Xonaga Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
