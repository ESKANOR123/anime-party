const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const cors = require('cors');
const { Server } = require('socket.io');

const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const { router: roomRoutes } = require('./routes/rooms');
const adminRoutes = require('./routes/admin');
const { setupSocketIO } = require('./socketHandler');

const app = express();
const server = http.createServer(app);

// Helper to get local network IP (Wi-Fi or LAN)
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('169.254.')) {
          return iface.address;
        }
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 5000;
const localIp = getLocalNetworkIp();
global.tunnelUrl = null;

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100MB
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directories for thumbnails & uploaded videos
const storagePath = path.join(__dirname, 'storage');
app.use('/storage', express.static(storagePath));

// API: Network Info for friends connection
app.get('/api/network-info', (req, res) => {
  res.json({
    success: true,
    localIp,
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://${localIp}:${PORT}`,
    tunnelUrl: global.tunnelUrl
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);

// Setup Socket.IO Signaling & Sync
setupSocketIO(io);

// Serve built frontend files in production / unified mode
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA Fallback: Any unknown route serves index.html
app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>AniWatch Party</title></head>
          <body style="background:#0b0e14;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
            <h1>AniWatch Party Server Ishga Tushdi!</h1>
            <p>Iltimos, frontendni build qiling (<code>npm run build</code>) yoki dev rejimida ishga tushiring.</p>
            <p>API holati: <span style="color:#10b981;">Faol</span></p>
          </body>
        </html>
      `);
    }
  });
});

// Initialize Database and Start Server
initDb();

// Bind to 0.0.0.0 so all network devices (phones, laptops, tablets) can connect!
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(`🚀 AniWatch Party Server ishga tushdi!`);
  console.log(`💻 O‘zingiz uchun:       http://localhost:${PORT}`);
  console.log(`📱 Do‘stlar uchun (Wi-Fi): http://${localIp}:${PORT}`);
  
  // If --tunnel argument provided, start public internet tunnel
  if (process.argv.includes('--tunnel')) {
    try {
      const localtunnel = require('localtunnel');
      console.log(`🌐 Do‘stlar uchun butun dunyo bo‘ylab global havola yaratilmoqda...`);
      const tunnel = await localtunnel({ port: PORT });
      global.tunnelUrl = tunnel.url;
      console.log(`🌍 Internet orqali Global Havola: ${tunnel.url}`);
      console.log(`   (Bu havolani xohlagan yerdagi do‘stlaringizga yuborishingiz mumkin!)`);
    } catch (e) {
      console.log(`Tunnel xatosi:`, e.message);
    }
  }

  console.log(`👑 Bosh Admin: akbarali`);
  console.log(`====================================================`);
});
