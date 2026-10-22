# 🎬 AniParty — Do‘stlar Bilan Birga Real-Vaqtda Anime Tomosha Qilish Sayti

Ushbu platforma do‘stlar bilan birgalikda jonli efirda anime tomosha qilish, video yuklash, kamera va ovozli muloqot qilish hamda kuchli admin paneliga ega to‘liq veb-saytdir.

---

## 🌟 Asosiy Imkoniyatlar

1. **Video / Anime Yuklash**:
   - Kompyuteringizdagi istalgan formatdagi videolarni (`.mp4`, `.webm`, `.mkv`, `.mov`) serverga yuklash.
   - Sarlavha, qism raqami, tavsif va muqova (poster) rasmini qo‘shish.
   - Katta hajmdagi videolarni qulay va tezkor yuklash uchun real-vaqtli progress bar (0% - 100%).
   - Brauzerda silliq o‘tkazish (scrubbing/seeking) uchun HTTP 206 Partial Content video oqimi.

2. **Watch Party / Lobby Tizimi (Do‘stlar bilan tomosha)**:
   - Xona (Lobby) yaratish va avtomatik noyob **Xona Kodi** (masalan: `ANM-7842`) olish.
   - **Do‘stlar uchun to‘g‘ridan-to‘g‘ri havola**: Bitta tugma bilan havolani nusxalash (`http://localhost:5000/?room=ANM-7842`).
   - Havolani ochgan har qanday do‘st hech qanday qiyinchiliksiz to‘g‘ridan-to‘g‘ri xonaga kiradi!

3. **100% Sinxronlashtirilgan Video Player**:
   - Xona egasi (host) animeni qo‘yganida (Play), to‘xtatganida (Pause) yoki oldinga/orqaga surganida (Seek) barcha ishtirokchilarda bir vaqtning o‘zida o‘zgaradi.
   - Kech qo‘shilgan do‘stlar darhol xona egasining ayni damdagi daqiqasiga avtomatik sinxronlashadi.
   - Xona egasi xonani tark etmasdan boshqa animeni almashtirishi mumkin.

4. **Kamera va Ovozli Jonli Muloqot (WebRTC Mesh)**:
   - Barcha qo‘shilganlar bir-birini jonli kamera orqali ko‘rib turadi.
   - Mikrofon orqali real-vaqtda gaplashish (ovozli chat).
   - Kamerani yoqish/o‘chirish va mikrofonni o‘chirish (Mute) tugmalari.
   - Kim gapirayotganini ko‘rsatuvchi yashil to‘lqinli indikator (Voice Activity Detection).

5. **Yuqori Sifatli Tiniq Audio (HQ Audio)**:
   - Anime ovozlarining tiniqligini ta'minlash uchun stereo va yuqori bitrate.
   - WebRTC muloqotida shovqinni tozalash (`noiseSuppression`) va aks-sadoni yo‘qotish (`echoCancellation`).
   - Anime ovozi uchun alohida ovoz slayderi.

6. **Jonli Matnli Chat va Suzuvchi Reaksiyalar (Emojis)**:
   - Ishtirokchilar uchun jonli yozishmali chat.
   - Ekranda yuqoriga uchib chiquvchi animatsiyali reaksiyalar: 🔥, ❤️, 😂, 🍿, 😱, 👏.

7. **👑 Super Admin Paneli**:
   - Maxsus bosh admin akkaunti:
     - **Login**: `akbarali`
     - **Parol**: `12345678aki`
   - Boshqaruv panelida:
     - Ro‘yxatdan o‘tgan barcha foydalanuvchilar ro‘yxati (o‘chirish, rolini o‘zgartirish).
     - Yuklangan barcha anime videolarni boshqarish (o‘chirish, ko‘rish).
     - Hozirgi jonli faol xonalarni real-vaqtda kuzatish va kerak bo‘lsa majburan yopish.
     - Server statistikasi (foydalanuvchilar soni, disk xotirasi, ko‘rishlar soni).

---

## 🚀 Ishga Tushirish Yo‘riqnomasi

### 1-Usul: Bitta bosish orqali (Windows)
Loyiha papkasidagi `start.bat` faylini ikki marta bosing.

### 2-Usul: Terminal / Buyruqlar satri orqali
```bash
# Loyiha papkasiga o'ting:
cd C:\Users\AKBARALI\.gemini\antigravity\scratch\anime-party

# Serverni ishga tushiring:
npm start
```

Brauzeringizda oching:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Hisoblar:
* **Admin (Akbarali)**:
  * Login: `akbarali`
  * Parol: `12345678aki`
* **Oddiy foydalanuvchilar**:
  * Saytning "Kirish / Ro‘yxatdan o‘tish" bo‘limidan o‘zlariga yangi hisob ochishlari yoki havola orqali mehmon sifatida tezkor kirishlari mumkin.
