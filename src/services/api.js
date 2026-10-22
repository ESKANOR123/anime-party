const API_BASE = '/api';

function getHeaders(isJson = true) {
  const token = localStorage.getItem('ani_token');
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- AUTH ---
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Kirishda xatolik yuz berdi');
    if (data.token) {
      localStorage.setItem('ani_token', data.token);
      localStorage.setItem('ani_user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(username, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
    if (data.token) {
      localStorage.setItem('ani_token', data.token);
      localStorage.setItem('ani_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe() {
    const token = localStorage.getItem('ani_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        localStorage.removeItem('ani_token');
        localStorage.removeItem('ani_user');
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('ani_token');
    localStorage.removeItem('ani_user');
  },

  // --- VIDEOS ---
  async getVideos() {
    const res = await fetch(`${API_BASE}/videos`);
    const data = await res.json();
    return data.videos || [];
  },

  async getVideo(id) {
    const res = await fetch(`${API_BASE}/videos/${id}`);
    const data = await res.json();
    return data.video;
  },

  async uploadVideo(formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/videos/upload`);
      const token = localStorage.getItem('ani_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res);
          } else {
            reject(new Error(res.message || 'Yuklashda xatolik'));
          }
        } catch {
          reject(new Error('Server javobini o‘qib bo‘lmadi'));
        }
      };

      xhr.onerror = () => reject(new Error('Tarmoq xatosi'));
      xhr.send(formData);
    });
  },

  async deleteVideo(id) {
    const res = await fetch(`${API_BASE}/videos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'O‘chirishda xatolik');
    return data;
  },

  // --- ROOMS ---
  async getNetworkInfo() {
    try {
      const res = await fetch(`${API_BASE}/network-info`);
      const data = await res.json();
      return data;
    } catch {
      return { networkUrl: window.location.origin };
    }
  },

  async createRoom(title, videoId, episodeIndex = 0, customCode) {
    const res = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, videoId, episodeIndex, customCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Xona yaratishda xatolik');
    return data.room;
  },

  async addEpisodes(animeId, formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/videos/${animeId}/add-episodes`);
      const token = localStorage.getItem('ani_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res);
          } else {
            reject(new Error(res.message || 'Qismlarni qo‘shishda xatolik'));
          }
        } catch {
          reject(new Error('Server javobini o‘qib bo‘lmadi'));
        }
      };

      xhr.onerror = () => reject(new Error('Tarmoq xatosi'));
      xhr.send(formData);
    });
  },

  async getRoom(code) {
    const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Xona topilmadi');
    return data.room;
  },

  async getRooms() {
    const res = await fetch(`${API_BASE}/rooms`);
    const data = await res.json();
    return data.rooms || [];
  },

  // --- ADMIN ---
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Statistikani yuklashda xatolik');
    return data.stats;
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Foydalanuvchilarni yuklashda xatolik');
    return data.users || [];
  },

  async deleteAdminUser(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Foydalanuvchini o‘chirishda xatolik');
    return data;
  },

  async updateAdminUserRole(id, role) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Rolni o‘zgartirishda xatolik');
    return data;
  },

  async getAdminRooms() {
    const res = await fetch(`${API_BASE}/admin/rooms`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Xonalarni olishda xatolik');
    return data.rooms || [];
  },

  async forceCloseRoom(code) {
    const res = await fetch(`${API_BASE}/admin/rooms/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Xonani yopishda xatolik');
    return data;
  }
};
