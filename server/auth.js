const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'anime_party_ultra_secret_key_akbarali_2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o‘tilmagan (Token topilmadi)' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, message: 'Yaroqsiz yoki muddati o‘tgan token' });
  }

  req.user = decoded;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.username !== 'akbarali')) {
    return res.status(403).json({ success: false, message: 'Faqatgina bosh admin video yuklashi mumkin!' });
  }
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin,
  optionalAuth
};
