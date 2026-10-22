const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

const VIDEOS_DIR = path.join(__dirname, '..', 'storage', 'videos');
const THUMBNAILS_DIR = path.join(__dirname, '..', 'storage', 'thumbnails');

// Ensure directories exist
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video' || file.fieldname === 'videos') {
      cb(null, VIDEOS_DIR);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, THUMBNAILS_DIR);
    } else {
      cb(null, VIDEOS_DIR);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 3072 * 1024 * 1024 // 3GB max per file
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video' || file.fieldname === 'videos') {
      const allowedExts = ['.mp4', '.webm', '.mkv', '.mov', '.avi'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext) || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Faqat video fayllar ruxsat etiladi (.mp4, .webm, .mkv, .mov)'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Faqat rasm fayllari ruxsat etiladi'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Helper to natural sort filenames (e.g. Ep1, Ep2, Ep10)
function naturalSortFiles(files) {
  return files.slice().sort((a, b) => 
    a.originalname.localeCompare(b.originalname, undefined, { numeric: true, sensitivity: 'base' })
  );
}

// GET /api/videos - List all anime
router.get('/', (req, res) => {
  const db = getDb();
  res.json({
    success: true,
    videos: db.videos || []
  });
});

// GET /api/videos/:id - Single anime with all episodes
router.get('/:id', (req, res) => {
  const db = getDb();
  const video = db.videos.find(v => v.id === req.params.id);
  if (!video) {
    return res.status(404).json({ success: false, message: 'Anime topilmadi' });
  }
  res.json({ success: true, video });
});

// POST /api/videos/upload - Upload new anime (Only Admin allowed!)
router.post('/upload', authenticateToken, requireAdmin, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'videos', maxCount: 100 }, // Allows batch upload of up to 100 episodes!
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, description, episode, videoUrl, isSeries } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Anime sarlavhasini kiriting' });
    }

    const singleVideoFile = req.files && req.files['video'] ? req.files['video'][0] : null;
    const multiVideoFiles = req.files && req.files['videos'] ? req.files['videos'] : [];
    const thumbFile = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

    if (!singleVideoFile && multiVideoFiles.length === 0 && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Hech bo‘lmaganda bitta video fayl yuklang yoki video URL kiriting' });
    }

    const uploader = req.user ? req.user.username : 'Mehmon';
    const uploaderId = req.user ? req.user.id : 'guest';

    let thumbnailUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
    if (thumbFile) {
      thumbnailUrl = `/api/videos/thumbnails/${thumbFile.filename}`;
    } else if (req.body.thumbnailUrl) {
      thumbnailUrl = req.body.thumbnailUrl;
    }

    const episodes = [];

    // Case 1: Multi-episode series uploaded with multiple files!
    if (multiVideoFiles.length > 0) {
      const sortedFiles = naturalSortFiles(multiVideoFiles);
      sortedFiles.forEach((file, idx) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);

        episodes.push({
          id: 'ep-' + uuidv4().slice(0, 8),
          episodeNumber: idx + 1,
          title: `${idx + 1}-Qism: ${baseName}`,
          filename: file.filename,
          url: `/api/videos/stream/file/${file.filename}`,
          duration: '24:00'
        });
      });
    } 
    // Case 2: Single local video file
    else if (singleVideoFile) {
      episodes.push({
        id: 'ep-' + uuidv4().slice(0, 8),
        episodeNumber: 1,
        title: episode ? episode.trim() : '1-Qism',
        filename: singleVideoFile.filename,
        url: `/api/videos/stream/file/${singleVideoFile.filename}`,
        duration: '24:00'
      });
    } 
    // Case 3: URL based video
    else if (videoUrl) {
      episodes.push({
        id: 'ep-' + uuidv4().slice(0, 8),
        episodeNumber: 1,
        title: episode ? episode.trim() : '1-Qism',
        filename: null,
        url: videoUrl.trim(),
        duration: '24:00'
      });
    }

    const newAnime = {
      id: 'anime-' + uuidv4().slice(0, 8),
      title: title.trim(),
      description: description ? description.trim() : 'Do‘stlar bilan birga tomosha qilinadigan anime.',
      isSeries: multiVideoFiles.length > 1 || isSeries === 'true',
      thumbnail: thumbnailUrl,
      uploader,
      uploaderId,
      createdAt: new Date().toISOString(),
      views: 0,
      episodes
    };

    const db = getDb();
    db.videos.unshift(newAnime);
    saveDb(db);

    res.status(201).json({
      success: true,
      message: multiVideoFiles.length > 1 
        ? `Ko‘p qismli anime (${episodes.length} ta qism) muvaffaqiyatli yuklandi!` 
        : 'Anime muvaffaqiyatli yuklandi!',
      video: newAnime
    });
  } catch (err) {
    console.error('Upload video error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server xatosi' });
  }
});

// POST /api/videos/:id/add-episodes - Add more episodes to an existing anime series (Only Admin allowed!)
router.post('/:id/add-episodes', authenticateToken, requireAdmin, upload.fields([
  { name: 'videos', maxCount: 100 }
]), (req, res) => {
  try {
    const db = getDb();
    const anime = db.videos.find(v => v.id === req.params.id);

    if (!anime) {
      return res.status(404).json({ success: false, message: 'Anime topilmadi' });
    }

    const files = req.files && req.files['videos'] ? req.files['videos'] : [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'Qo‘shish uchun video fayllarni tanlang' });
    }

    if (!anime.episodes) anime.episodes = [];

    const sortedFiles = naturalSortFiles(files);
    let startIdx = anime.episodes.length;

    sortedFiles.forEach((file, idx) => {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const epNum = startIdx + idx + 1;

      anime.episodes.push({
        id: 'ep-' + uuidv4().slice(0, 8),
        episodeNumber: epNum,
        title: `${epNum}-Qism: ${baseName}`,
        filename: file.filename,
        url: `/api/videos/stream/file/${file.filename}`,
        duration: '24:00'
      });
    });

    anime.isSeries = true;
    saveDb(db);

    res.json({
      success: true,
      message: `${files.length} ta yangi qism qo‘shildi!`,
      video: anime
    });
  } catch (err) {
    console.error('Add episodes error:', err);
    res.status(500).json({ success: false, message: 'Qismlarni qo‘shishda xatolik' });
  }
});

// GET /api/videos/stream/file/:filename - HTTP 206 Partial Content video streaming (crucial for smooth scrubbing)
router.get('/stream/file/:filename', (req, res) => {
  const filePath = path.join(VIDEOS_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Video fayli topilmadi');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// GET /api/videos/thumbnails/:filename
router.get('/thumbnails/:filename', (req, res) => {
  const filePath = path.join(THUMBNAILS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Rasm topilmadi');
  }
  res.sendFile(filePath);
});

// DELETE /api/videos/:id - Delete whole anime
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const videoIndex = db.videos.findIndex(v => v.id === req.params.id);

  if (videoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Anime topilmadi' });
  }

  const video = db.videos[videoIndex];

  // Only admin or uploader can delete
  if (req.user.role !== 'admin' && req.user.id !== video.uploaderId) {
    return res.status(403).json({ success: false, message: 'Sizda bu videoni o‘chirish huquqi yo‘q' });
  }

  // Delete all episode files
  if (video.episodes && Array.isArray(video.episodes)) {
    video.episodes.forEach(ep => {
      if (ep.filename) {
        const filePath = path.join(VIDEOS_DIR, ep.filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    });
  }

  db.videos.splice(videoIndex, 1);
  saveDb(db);

  res.json({ success: true, message: 'Anime butunlay o‘chirildi' });
});

module.exports = router;
