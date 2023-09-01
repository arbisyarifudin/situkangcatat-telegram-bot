require('dotenv').config()

const { attendanceHandler, dailyReportHandler } = require('./handlers')

// const eventTypes = [
//   'attendance', // untuk handle masalah presensi
//   'daily_report' // untuk handle masalah laporan harian
// ]

// ID grup yang diizinkan
const allowedGroup = [
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

module.exports = {
  init: (bot) => {
    // Message event listener
    bot.on('message', async (msg) => {
      //   console.log('message', msg)

      const chatId = msg.chat.id
      const threadId = msg.message_thread_id

      // Cek apakah pesan masuk dari grup yang diizinkan
      const isAllowedGroup = allowedGroup.some(group => {
        return group.id === chatId && group.topicIds.includes(threadId)
      })

      if (!isAllowedGroup) return

      // get event type based on allowedGroup
      if (threadId) {
        const allowedGroupData = allowedGroup.find(group => {
          return group.id === chatId && group.topicIds.includes(threadId)
        })

        if (allowedGroupData.event === 'attendance') {
          attendanceHandler(bot, msg)
        } else if (allowedGroupData.event === 'daily_report') {
          dailyReportHandler(bot, msg)
        }
      }
    })
  }
}
