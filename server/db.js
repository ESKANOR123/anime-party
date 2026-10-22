const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'storage', 'data.json');

// Initialize database with default admin 'akbarali' and sample anime videos (including JoJo multi-episode series)
function initDb() {
  const adminHashedPassword = bcrypt.hashSync('12345678aki', 10);

  const defaultData = {
    users: [
      {
        id: 'admin-akbarali-001',
        username: 'akbarali',
        password: adminHashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=akbarali'
      }
    ],
    videos: [
      {
        id: 'anime-jojo-bizarre',
        title: "JoJo's Bizarre Adventure (JoJoning g‘aroyib sarguzashtlari)",
        description: "Joestar xonadoni va Dio Brando o‘rtasidagi ko‘p avlodli afsonaviy kurash. Qadimgi tosh niqob sirlari, Hamon texnikalari va Stand janglari bilan to‘la ko‘p qismli sarguzasht.",
        isSeries: true,
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        uploader: 'akbarali',
        uploaderId: 'admin-akbarali-001',
        createdAt: new Date().toISOString(),
        views: 450,
        episodes: [
          {
            id: 'jojo-ep-1',
            episodeNumber: 1,
            title: '1-Qism: Dio the Invader (Dio — kutilmagan mehmon)',
            filename: null,
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            duration: '24:00'
          },
          {
            id: 'jojo-ep-2',
            episodeNumber: 2,
            title: '2-Qism: A Letter from the Past (O‘tmishdan maktub)',
            filename: null,
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            duration: '23:45'
          },
          {
            id: 'jojo-ep-3',
            episodeNumber: 3,
            title: '3-Qism: Youth with Dio (Dio bilan kechgan yoshlik)',
            filename: null,
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            duration: '24:12'
          },
          {
            id: 'jojo-ep-4',
            episodeNumber: 4,
            title: '4-Qism: Overdrive (Hamon kuchi namoyishi)',
            filename: null,
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            duration: '23:50'
          }
        ]
      },
      {
        id: 'sample-anime-01',
        title: 'Attack on Titan: The Final Season',
        description: 'Eren Yeager va uning do‘stlari o‘rtasidagi eng shiddatli jang. Do‘stlar bilan birgalikda HD sifatda tomosha qiling!',
        isSeries: false,
        thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
        uploader: 'akbarali',
        uploaderId: 'admin-akbarali-001',
        createdAt: new Date().toISOString(),
        views: 142,
        episodes: [
          {
            id: 'aot-ep-1',
            episodeNumber: 1,
            title: '1-Qism (Maxsus film)',
            filename: null,
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            duration: '24:00'
          }
        ]
      },
      {
        id: 'sample-anime-02',
        title: 'Cyberpunk Edgerunners: Night City Tales',
        description: 'Night City ko‘chalarida adrenalin va neon chiroqlar ostida kechadigan sarguzashtlar. Ajoyib audio va video effektlar.',
        isSeries: false,
        thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
        uploader: 'akbarali',
        uploaderId: 'admin-akbarali-001',
        createdAt: new Date().toISOString(),
        views: 89,
        episodes: [
          {
            id: 'cp-ep-1',
            episodeNumber: 1,
            title: 'Treyler & Maxsus lavha',
            filename: null,
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            duration: '15:20'
          }
        ]
      },
      {
        id: 'sample-anime-03',
        title: 'Demon Slayer: Kimetsu no Yaiba',
        description: 'Tanjiro va Nezuko iblislar qiroli Muzanga qarshi kurashi. Hashiralarning afsonaviy janglari.',
        isSeries: false,
        thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
        uploader: 'akbarali',
        uploaderId: 'admin-akbarali-001',
        createdAt: new Date().toISOString(),
        views: 215,
        episodes: [
          {
            id: 'ds-ep-1',
            episodeNumber: 1,
            title: '1-Fasl Prevyu',
            filename: null,
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            duration: '22:15'
          }
        ]
      }
    ],
    rooms: []
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    console.log('[DB] Database created with default admin: akbarali');
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    
    // Ensure admin user exists and has correct password
    let admin = data.users.find(u => u.username === 'akbarali');
    if (!admin) {
      data.users.unshift(defaultData.users[0]);
      saveDb(data);
      console.log('[DB] Admin user akbarali restored.');
    } else if (!bcrypt.compareSync('12345678aki', admin.password)) {
      admin.password = adminHashedPassword;
      admin.role = 'admin';
      saveDb(data);
      console.log('[DB] Admin akbarali password updated.');
    }
    
    // Ensure videos have episodes array
    if (data.videos) {
      let changed = false;
      data.videos.forEach((v, index) => {
        if (!v.episodes || v.episodes.length === 0) {
          v.episodes = [
            {
              id: 'ep-' + (index + 1),
              episodeNumber: 1,
              title: v.episode || '1-Qism',
              filename: v.filename || null,
              url: v.url || '',
              duration: '24:00'
            }
          ];
          changed = true;
        }
      });

      // Add JoJo if not present
      if (!data.videos.some(v => v.id === 'anime-jojo-bizarre')) {
        data.videos.unshift(defaultData.videos[0]);
        changed = true;
      }

      if (changed) {
        saveDb(data);
      }
    } else {
      data.videos = defaultData.videos;
      saveDb(data);
    }

    if (!data.rooms) {
      data.rooms = [];
      saveDb(data);
    }

    return data;
  } catch (err) {
    console.error('[DB] Error loading DB, recreating:', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

function getDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return initDb();
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return initDb();
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[DB] Failed to save DB:', err);
    return false;
  }
}

module.exports = {
  initDb,
  getDb,
  saveDb
};
