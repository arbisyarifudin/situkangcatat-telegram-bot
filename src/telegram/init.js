require('dotenv').config()

const { allowedGroups } = require('../configs/telegramConfig')
const { attendanceHandler, dailyReportHandler } = require('./handlers')

module.exports = {
  init: (bot) => {
    // Message event listener
    bot.on('message', async (msg) => {
      //   console.log('message', msg)

      const chatId = msg.chat.id
      const threadId = msg.message_thread_id

      // Cek apakah pesan masuk dari grup yang diizinkan
      const isAllowedGroup = allowedGroups.some(group => {
        return group.id === chatId && group.topicIds.includes(threadId)
      })

      if (!isAllowedGroup) return

      // get event type based on allowedGroups
      if (threadId) {
        const allowedGroupData = allowedGroups.find(group => {
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
