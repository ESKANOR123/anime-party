import React, { useState } from 'react';
import { X, Upload, Film, Image as ImageIcon, Link as LinkIcon, CheckCircle2, Layers, Plus, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess, existingAnimeList = [], user }) {
  const [mode, setMode] = useState('series'); // 'series' (multi-episode), 'single' (one video), 'append' (add to existing)
  const [title, setTitle] = useState('');
  const [episodeName, setEpisodeName] = useState('1-Qism');
  const [description, setDescription] = useState('');
  const [selectedAnimeId, setSelectedAnimeId] = useState(existingAnimeList[0]?.id || '');

  // Files
  const [singleVideoFile, setSingleVideoFile] = useState(null);
  const [multiVideoFiles, setMultiVideoFiles] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isAdmin = user && (user.role === 'admin' || user.username === 'akbarali');

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-sm glass-panel rounded-2xl border border-rose-500/30 p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-white">Ruxsat Berilmagan</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Faqatgina Bosh Admin (<strong className="text-rose-400">akbarali</strong>) yangi video yoki anime yuklay oladi.
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
          >
            Tushundim
          </button>
        </div>
      </div>
    );
  }

  // Multi file change handler
  const handleMultiFilesChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      setMultiVideoFiles(filesArray);
      if (!title && filesArray.length > 0) {
        // Auto-suggest series title from first file if empty
        const cleanName = filesArray[0].name.replace(/\.[^/.]+$/, '').replace(/[_.-]/g, ' ');
        setTitle(cleanName.split(/\d+/)[0].trim() || 'Yangi Anime Seriyasi');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'append') {
      if (!selectedAnimeId) {
        setError('Animeni tanlang');
        return;
      }
      if (multiVideoFiles.length === 0) {
        setError('Qo‘shish uchun kamida bitta video fayl tanlang');
        return;
      }

      setLoading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        multiVideoFiles.forEach((f) => formData.append('videos', f));

        const res = await api.addEpisodes(selectedAnimeId, formData, (p) => setProgress(p));
        if (onUploadSuccess) onUploadSuccess(res.video);
        onClose();
      } catch (err) {
        setError(err.message || 'Qismlarni qo‘shishda xatolik');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!title.trim()) {
      setError('Anime nomini kiriting');
      return;
    }

    if (mode === 'series' && multiVideoFiles.length === 0) {
      setError('Kamida bitta yoki bir nechta qism fayllarini tanlang');
      return;
    }

    if (mode === 'single' && !singleVideoFile && !videoUrl.trim()) {
      setError('Video fayl tanlang yoki video URL kiriting');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('isSeries', mode === 'series' ? 'true' : 'false');

      if (mode === 'series') {
        multiVideoFiles.forEach((file) => {
          formData.append('videos', file);
        });
      } else {
        if (singleVideoFile) {
          formData.append('video', singleVideoFile);
        } else {
          formData.append('videoUrl', videoUrl.trim());
        }
        formData.append('episode', episodeName.trim());
      }

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl.trim()) {
        formData.append('thumbnailUrl', thumbnailUrl.trim());
      }

      const res = await api.uploadVideo(formData, (p) => {
        setProgress(p);
      });

      if (onUploadSuccess) {
        onUploadSuccess(res.video);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-white/10 shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20 mb-2">
            <Upload className="w-3.5 h-3.5" />
            Anime Yuklash Markazi
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">
            {mode === 'series' ? 'Ko‘p Qismli Anime Yuklash' : mode === 'append' ? 'Mavjud Animega Qismlar Qo‘shish' : 'Bitta Video Yuklash'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            JoJo yoki boshqa ko‘p qismli animelarni bir vaqtning o‘zida ommaviy (batch) tarzda yuklang.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 mb-5 border border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('series'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'series' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Ko‘p Qismli (Serial)
          </button>
          <button
            type="button"
            onClick={() => { setMode('single'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'single' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Bitta Video (Film)
          </button>
          {existingAnimeList.length > 0 && (
            <button
              type="button"
              onClick={() => { setMode('append'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'append' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Qism Qo‘shish
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* MODE: APPEND TO EXISTING ANIME */}
          {mode === 'append' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Qaysi animega yangi qismlar qo‘shmoqchisiz?
              </label>
              <select
                value={selectedAnimeId}
                onChange={(e) => setSelectedAnimeId(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 cursor-pointer mb-4"
              >
                {existingAnimeList.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                    {a.title} (Hozirda {a.episodes?.length || 1} ta qism)
                  </option>
                ))}
              </select>

              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Yangi Qism Fayllari (Bir nechta fayl tanlashingiz mumkin)
              </label>
              <div className="border-2 border-dashed border-white/15 rounded-xl p-5 text-center hover:border-pink-500/50 transition-colors bg-slate-950/40">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleMultiFilesChange}
                  className="hidden"
                  id="append-multi-upload"
                />
                <label htmlFor="append-multi-upload" className="cursor-pointer block">
                  <Layers className="w-9 h-9 text-pink-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-200">
                    {multiVideoFiles.length > 0
                      ? `${multiVideoFiles.length} ta yangi qism fayli tanlandi`
                      : 'Kompyuterdan yangi qism fayllarini tanlang'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ctrl yoki Shift bosib bir vaqtda 5, 10, 20+ qismlarni tanlang
                  </p>
                </label>
              </div>
            </div>
          ) : (
            <>
              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anime Nomi *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: JoJo's Bizarre Adventure (JoJo)"
                  required
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* MULTI-EPISODE UPLOAD DROPZONE */}
              {mode === 'series' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Qismlar Video Fayllari (Bir nechta fayl tanlang) *
                    </label>
                    <span className="text-[11px] text-pink-400 font-bold">
                      {multiVideoFiles.length} ta qism tanlandi
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-white/15 rounded-xl p-5 text-center hover:border-pink-500/50 transition-colors bg-slate-950/40">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleMultiFilesChange}
                      className="hidden"
                      id="series-multi-upload"
                    />
                    <label htmlFor="series-multi-upload" className="cursor-pointer block">
                      <Layers className="w-10 h-10 text-pink-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-200">
                        {multiVideoFiles.length > 0
                          ? `${multiVideoFiles.length} ta qism fayli yuklashga tayyor!`
                          : 'Barcha qismlarni bir vaqtda tanlang (Multiple Files)'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Masalan: jojo_01.mp4, jojo_02.mp4, jojo_03.mp4...
                      </p>
                    </label>
                  </div>

                  {/* List of detected episodes */}
                  {multiVideoFiles.length > 0 && (
                    <div className="mt-2.5 max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                      {multiVideoFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300"
                        >
                          <span className="font-bold text-pink-400 shrink-0 mr-2">
                            {idx + 1}-Qism:
                          </span>
                          <span className="truncate flex-1 text-[11px] font-mono">{file.name}</span>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SINGLE VIDEO UPLOAD */}
              {mode === 'single' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Qism Nomi
                    </label>
                    <input
                      type="text"
                      value={episodeName}
                      onChange={(e) => setEpisodeName(e.target.value)}
                      placeholder="1-Qism yoki Film"
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Video Fayl (.mp4, .webm, .mkv)
                    </label>
                    <div className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center hover:border-pink-500/50 transition-colors bg-slate-950/40">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setSingleVideoFile(e.target.files[0])}
                        className="hidden"
                        id="single-file-upload"
                      />
                      <label htmlFor="single-file-upload" className="cursor-pointer block">
                        <Film className="w-8 h-8 text-pink-400 mx-auto mb-1.5" />
                        {singleVideoFile ? (
                          <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {singleVideoFile.name} ({(singleVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                          </p>
                        ) : (
                          <p className="text-xs text-slate-300 font-semibold">Bitta video faylni tanlang</p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Cover / Poster Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anime Muqova Rasmi (Poster)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files[0])}
                    className="hidden"
                    id="thumb-series-upload"
                  />
                  <label
                    htmlFor="thumb-series-upload"
                    className="flex-1 cursor-pointer bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-300 hover:border-pink-500 flex items-center gap-2 truncate"
                  >
                    <ImageIcon className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="truncate">
                      {thumbnailFile ? thumbnailFile.name : 'Rasm faylini tanlash (ixtiyoriy)...'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anime Tavsifi (Ixtiyoriy)
                </label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Joestar oilasi sarguzashtlari haqida..."
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                ></textarea>
              </div>
            </>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>
                  {mode === 'series'
                    ? `${multiVideoFiles.length} ta qism serverga yuklanmoqda...`
                    : 'Yuklanmoqda...'}
                </span>
                <span className="text-pink-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {mode === 'series'
                  ? `Barcha Qismlarni Yuklash (${multiVideoFiles.length} ta)`
                  : mode === 'append'
                  ? 'Qismlarni Qo‘shish'
                  : 'Video Yuklash'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
