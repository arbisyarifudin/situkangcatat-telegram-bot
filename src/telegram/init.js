require('dotenv').config()

const { allowedGroups } = require('../configs/telegramConfig')
const { attendanceHandler, dailyReportHandler, commandHandler } = require('./handlers')

module.exports = {
  init: (bot) => {
    // Message event listener
    bot.on('message', async (msg) => {
    //   console.log('on message')
      //   console.log('message', msg)

      const chatId = msg.chat.id
      const topicId = msg.message_thread_id
      const isBot = msg.from.is_bot

      // Cek apakah pesan masuk dari grup yang diizinkan
      const isAllowedGroup = allowedGroups.some(group => {
        return group.id === chatId
      })

      //   console.log('isAllowedGroup', isAllowedGroup)

      if (!isAllowedGroup) return
      if (isBot) return

      // get type type based on allowedGroups
      if (topicId) {
        const groupData = allowedGroups.find(group => {
          return group.id === chatId && group.topics.some(topic => topic.id === topicId)
        })

        // console.log('groupData', groupData)

        if (!groupData) return

        // get topic data
        const topicData = groupData.topics.find(topic => topic.id === topicId)

        // console.log('topicData', topicData)

        if (!topicData) return

        const messageText = msg.text ? msg.text : msg.caption ? msg.caption : ''

        // handle type
        if (topicData.type === 'attendance' && !messageText.startsWith('/')) {
          return attendanceHandler(bot, msg)
        } else if (topicData.type === 'daily_report') {
          return dailyReportHandler(bot, msg)
        } else {
          // check apakah pesan memiliki awalan "/" atau tidak, misal "/presensi" atau "/laporan-presensi"
          if (messageText && messageText.startsWith('/')) {
            // console.log('text starts with "/"')
            return commandHandler(bot, msg)
          }
        }
      }
    })

    // Menangani pesan yang mengandung perintah
    // bot.onText(/\/\w+/, (msg) => {
    // //   console.log('receive text with "/"', msg.text)
    //   console.log('onText')
    //   commandHandler(bot, msg)
    // })
  }
}
