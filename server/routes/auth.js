const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../db');
const { generateToken, authenticateToken } = require('../auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi nomi va parol kiritilishi shart' });
    }

    const trimmedUser = username.trim().toLowerCase();
    if (trimmedUser.length < 3) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo‘lishi kerak' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Parol kamida 4 ta belgidan iborat bo‘lishi kerak' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.username.toLowerCase() === trimmedUser);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu nomdagi foydalanuvchi allaqachon mavjud' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: uuidv4(),
      username: username.trim(),
      password: hashedPassword,
      role: 'user', // Oddiy foydalanuvchilar 'user' roliga ega
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username.trim())}`,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDb(db);

    const token = generateToken(newUser);
    res.status(201).json({
      success: true,
      message: 'Muvaffaqiyatli ro‘yxatdan o‘tdingiz!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        avatar: newUser.avatar
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Login va parolni kiriting' });
    }

    const db = getDb();
    const trimmedUser = username.trim().toLowerCase();
    const user = db.users.find(u => u.username.toLowerCase() === trimmedUser);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Login yoki parol noto‘g‘ri' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Login yoki parol noto‘g‘ri' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: user.role === 'admin' ? 'Xush kelibsiz, Admin Akbarali!' : 'Xush kelibsiz!',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar
    }
  });
});

module.exports = router;
