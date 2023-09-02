# BOT SITUKANGCATAT
Telegram bot untuk mencatat presensi kehadiran dan laporan harian (daily report) pada sebuah grup.

## Fitur
- ✅ Menampilkan command / perintah yang tersedia
- ✅ Mencatat presensi kehadiran
- ✅ Mencatat laporan harian
- ✅ Ada endpoint pengingat presensi kehadiran
- ✅ Ada endpoint pengingat laporan harian
- 🕦 Menampilkan laporan tahunan (TODO)
- 🕦 Menampilkan laporan bulanan (TODO)


## Cara Install
1. Clone repository ini
2. Buka terminal dan masuk ke direktori repository
3. Jalankan `yarn install` atau `npm install`
4. Buat file `.env` dan isi dengan:
```
TELEGRAM_BOT_TOKEN=
```

## Cara Membuat Bot Telegram dan Mendapatkan Token
1. Buka Telegram
2. Cari bot dengan username `@botfather`
3. Ketik `/newbot` dan ikuti petunjuknya
4. Setelah bot berhasil dibuat, salin token yang diberikan
5. Buka file `.env` dan isi `TELEGRAM_BOT_TOKEN` dengan token yang sudah disalin

## Cara Mengatur ID Grup
1. Buka Telegram Web di https://web.telegram.org/a
2. Buka grup yang ingin ditambahkan bot
3. Lihat URL di browser, salin angka setelah `#` (contoh: `https://web.telegram.org/a/#-1812257489`). ID grup adalah angka tersebut dengan menambahkan 100 di depannya (contoh: `-1001812257489`
4. Buka file `databases/groups.json` dan tambahkan ID grup tersebut ke dalam array

## Cara Menambah ID Topic
1. Buka Telegram Web di https://web.telegram.org/a
2. Buka grup yang ingin ditambahkan bot
3. Lihat URL di browser, salin angka setelah Grup ID (contoh: `https://web.telegram.org/a/#-1812257489_123`). ID topic adalah angka tersebut (contoh: `123`)
4. Buka file `databases/groups.json` dan tambahkan ID topic tersebut ke dalam array `topics` pada grup yang bersangkutan

## Cara Jalankan Bot
1. Buka terminal dan masuk ke direktori repository
2. Jalankan `yarn dev` atau `npm run dev` untuk menjalankan bot dalam mode development atau `yarn start` atau `npm run start` untuk menjalankan bot dalam mode production