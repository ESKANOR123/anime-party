import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, Send, Wifi, Globe, Smartphone, Users } from 'lucide-react';
import { api } from '../services/api';

export default function InviteModal({ isOpen, onClose, roomCode, roomTitle }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.getNetworkInfo().then(info => {
        if (info) setNetworkInfo(info);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Best shareable link
  const origin = networkInfo?.tunnelUrl 
    ? networkInfo.tunnelUrl 
    : (networkInfo?.networkUrl || window.location.origin);

  const shareLink = `${origin}/?room=${encodeURIComponent(roomCode)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}&bgcolor=10-15-26&color=236-72-153`;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = (linkToCopy) => {
    navigator.clipboard.writeText(linkToCopy || shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareTelegram = () => {
    const text = `Salom! Keling birga anime ko‘ramiz. Xona: "${roomTitle || 'AniParty'}"`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-white/10 shadow-2xl p-6 text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-600 mb-3 shadow-lg shadow-pink-500/25">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h2 className="font-heading text-xl font-bold text-white">Do‘stlarni Taklif Qilish</h2>
        <p className="text-xs text-slate-400 mt-1">
          Do‘stlaringiz telefon yoki kompyuterdan ushbu havola yoki QR kod orqali xonaga qo‘shilishi mumkin!
        </p>

        {/* QR Code Section for Phones */}
        <div className="my-5 p-3 rounded-2xl bg-slate-950/80 border border-white/10 inline-block shadow-inner">
          <img
            src={qrCodeUrl}
            alt="Xona QR Kodi"
            className="w-36 h-36 rounded-xl mx-auto shadow-md"
          />
          <p className="text-[10px] text-pink-300 font-bold mt-2 flex items-center justify-center gap-1">
            <Smartphone className="w-3.5 h-3.5" />
            Telefon kamerasini qaratib kiring!
          </p>
        </div>

        {/* Room Code */}
        <div className="mb-3 p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Xona Kodi</span>
            <div className="text-base font-mono font-bold text-cyan-400 tracking-wider">
              {roomCode}
            </div>
          </div>
          <button
            onClick={copyCode}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Nusxalandi' : 'Kodni nusxalash'}</span>
          </button>
        </div>

        {/* Direct Link */}
        <div className="mb-4 p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between gap-2 text-left">
          <div className="truncate flex-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Wifi className="w-3 h-3 text-pink-400" />
              Do‘stlar uchun to‘g‘ridan-to‘g‘ri havola
            </span>
            <div className="text-xs font-mono text-pink-300 truncate mt-0.5">
              {shareLink}
            </div>
          </div>
          <button
            onClick={() => copyLink(shareLink)}
            className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-xs font-bold text-white transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-pink-500/20"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Nusxalandi' : 'Havola'}</span>
          </button>
        </div>

        {/* Telegram Share Button */}
        <button
          onClick={shareTelegram}
          className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
        >
          <Send className="w-4 h-4" />
          <span>Telegram orqali do‘stga yuborish</span>
        </button>
      </div>
    </div>
  );
}
