require('dotenv').config()

// const eventTypes = [
//   'attendance', // untuk handle masalah presensi
//   'daily_report' // untuk handle masalah laporan harian
// ]

module.exports = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  allowedGroups: [
    {
      id: -1001812257489, // ID grup di Telegram (ganti dengan ID grup Anda)
      topicIds: [23], // ID topik di grup (ganti dengan ID topik Anda)
      event: 'attendance' // Jenis event untuk penanda fungsionalitas bot
    },
    {
      id: -1001812257489,
      topicIds: [107],
      event: 'daily_report'
    }
  ]
}
