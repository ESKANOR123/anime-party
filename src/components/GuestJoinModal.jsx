import React, { useState } from 'react';
import { Users, ArrowRight, Sparkles } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoro',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luffy',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasuke'
];

export default function GuestJoinModal({ isOpen, roomCode, onJoinWithGuestName }) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Iltimos, ismingizni kiriting');
      return;
    }

    const cleanName = name.trim();
    localStorage.setItem('ani_guest_name', cleanName);
    localStorage.setItem('ani_guest_avatar', selectedAvatar);

    onJoinWithGuestName({
      username: cleanName,
      avatar: selectedAvatar
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm glass-panel rounded-3xl border border-pink-500/30 shadow-2xl p-6 text-center">
        
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-violet-600 mb-3 shadow-lg shadow-pink-500/30">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <h2 className="font-heading text-xl font-bold text-white">Xonaga Qo‘shilish</h2>
        <p className="text-xs text-slate-400 mt-1">
          Do‘stingiz sizni anime tomosha qilishga taklif qildi!
        </p>
        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/20">
          Xona Kodi: {roomCode}
        </span>

        {error && (
          <div className="mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ismingiz (Do‘stlar sizni ko‘rishi uchun) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Jasur yoki Sardor"
              required
              autoFocus
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Avataringizni tanlang:
            </label>
            <div className="flex items-center justify-between gap-1">
              {AVATAR_OPTIONS.map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt=""
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-9 h-9 rounded-full cursor-pointer transition-all border-2 ${
                    selectedAvatar === av
                      ? 'border-pink-500 scale-110 shadow-lg shadow-pink-500/40 bg-pink-500/20'
                      : 'border-transparent hover:border-white/30 bg-slate-800 opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
          >
            <span>Xonaga Kirish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
