const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getDb, saveDb } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');
const { getActiveRoomsMap } = require('./rooms');

// All routes in admin require token & admin role
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Overview statistics
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const activeRooms = getActiveRoomsMap();

    const VIDEOS_DIR = path.join(__dirname, '..', 'storage', 'videos');
    let totalStorageBytes = 0;
    if (fs.existsSync(VIDEOS_DIR)) {
      const files = fs.readdirSync(VIDEOS_DIR);
      files.forEach(f => {
        try {
          const stat = fs.statSync(path.join(VIDEOS_DIR, f));
          totalStorageBytes += stat.size;
        } catch (e) {}
      });
    }

    let totalParticipants = 0;
    activeRooms.forEach(r => {
      totalParticipants += (r.participants ? r.participants.length : 0);
    });

    const totalViews = (db.videos || []).reduce((sum, v) => sum + (v.views || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers: (db.users || []).length,
        totalVideos: (db.videos || []).length,
        activeRoomsCount: activeRooms.size,
        liveParticipants: totalParticipants,
        totalViews,
        storageMB: (totalStorageBytes / (1024 * 1024)).toFixed(2)
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/admin/users - List all users
router.get('/users', (req, res) => {
  const db = getDb();
  const safeUsers = (db.users || []).map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
    avatar: u.avatar
  }));

  res.json({ success: true, users: safeUsers });
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
  }

  // Prevent deleting superadmin akbarali
  if (user.username === 'akbarali') {
    return res.status(400).json({ success: false, message: 'Bosh admin akbarali profilini o‘chirib bo‘lmaydi!' });
  }

  db.users = db.users.filter(u => u.id !== req.params.id);
  saveDb(db);

  res.json({ success: true, message: `Foydalanuvchi "${user.username}" o‘chirildi` });
});

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Yaroqsiz rol' });
  }

  const db = getDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
  }

  if (user.username === 'akbarali' && role !== 'admin') {
    return res.status(400).json({ success: false, message: 'Akbarali har doim bosh admin bo‘lib qolishi shart!' });
  }

  user.role = role;
  saveDb(db);

  res.json({ success: true, message: `Foydalanuvchi roli ${role} ga o‘zgartirildi` });
});

// GET /api/admin/rooms - Detailed active rooms
router.get('/rooms', (req, res) => {
  const activeRooms = getActiveRoomsMap();
  const list = [];
  activeRooms.forEach((r, code) => {
    list.push({
      id: r.id,
      code: r.code,
      title: r.title,
      hostName: r.hostName,
      videoTitle: r.currentVideo ? r.currentVideo.title : 'Yo‘q',
      isPlaying: r.isPlaying,
      currentTime: r.currentTime,
      participants: r.participants || [],
      createdAt: r.createdAt
    });
  });

  res.json({ success: true, rooms: list });
});

// DELETE /api/admin/rooms/:code - Force close room
router.delete('/rooms/:code', (req, res) => {
  const activeRooms = getActiveRoomsMap();
  const code = req.params.code.toUpperCase();
  if (activeRooms.has(code)) {
    activeRooms.delete(code);
    return res.json({ success: true, message: `Xona ${code} majburan yopildi` });
  }
  res.status(404).json({ success: false, message: 'Xona topilmadi' });
});

module.exports = router;
