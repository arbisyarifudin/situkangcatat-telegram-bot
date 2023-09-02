// Path: src/controllers/sendDailyReportReminder.js
const moment = require('moment')
require('moment-timezone')
// require('moment/locale/id')
require('moment/locale/id')
moment.locale('id')

const { allowedGroups } = require('../configs/telegramConfig')
const appConfig = require('../configs/appConfig')
const { getLogDatabase, updateLogDatabase, getMemberData } = require('../telegram/helpers')

module.exports = async (req, res) => {
//   console.log('Sending dailyReport reminder...')

  // get bot instance from req
  const bot = req.bot

  //   console.log('bot', bot)

  // get cron password from config
  const { cronPassword } = appConfig.cronPassword

  // get password from req
  const { password } = req.body

  // check if password is correct
  if (password !== cronPassword) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  // ambil group dan topic yang memiliki type 'daily_report'
  const groups = allowedGroups.filter(group => group.topics.find(topic => topic.type === 'daily_report'))

  // console.log('groups', groups)

  // get all group id
  const groupIds = groups.map(group => group.id)

  // get current date
  const currentDate = moment().format('YYYY-MM-DD')

  const logReminders = getLogDatabase(currentDate, 'reminders')

  //   console.log('logReminders', logReminders)

  // ambil jam dan menit dari waktu saat ini
  const currentHour = moment().format('HH')
  const currentMinute = moment().format('mm')
  const currentDay = moment().format('dddd') // Nama hari dalam bahasa Indonesia

  //   const isTimeToSend = (currentHour === '07' && currentMinute === '55') || (currentHour === '15' && currentMinute === '55')
  const isTimeToSend = true

  if (!isTimeToSend) {
    // Jika bukan waktu yang ditentukan, maka kirim response API
    return res.json({ message: 'Not time yet' })
  }

  if (currentDay.toLowerCase() === 'minggu') {
    // Jika hari Minggu, maka kirim response API
    return res.json({ message: 'It\'s Sunday' })
  }

  // cek apakah ada member yang belum laporan harian
  const members = getMemberData(groupIds)
  //   console.log('members', members)

  // dailyReport logs for today
  const dailyReportLogs = getLogDatabase(currentDate, 'daily_reports')
  //   console.log('dailyReportLogs', dailyReportLogs)

  // get all member id
  const memberIds = members.map(member => member.id)
  //   console.log('memberIds', memberIds)

  // get all dailyReport log for today
  const dailyReportLogsForToday = dailyReportLogs.filter(log => memberIds.includes(log.member_id))

  //   console.log('dailyReportLogsForToday', dailyReportLogsForToday)

  // get all member id that has dailyReport log for today
  const memberIdsWithdailyReportLog = dailyReportLogsForToday.map(log => log.member_id)

  //   console.log('memberIdsWithdailyReportLog', memberIdsWithdailyReportLog)

  // get all member id that has no dailyReport log for today
  const memberIdsWithoutdailyReportLog = memberIds.filter(memberId => !memberIdsWithdailyReportLog.includes(memberId))

  //   console.log('memberIdsWithoutdailyReportLog', memberIdsWithoutdailyReportLog)

  if (memberIdsWithoutdailyReportLog.length === 0) {
    // Jika semua member sudah laporan harian, maka kirim response API
    return res.json({ message: 'All members have daily_report log' })
  }

  // get reminder type
  const reminderType = 'daily_report'

  // cek apakah sudah ada pengingat daily report di log untuk hari ini
  const isReminderSent = logReminders.find(reminder => reminder.type === reminderType)

  //   console.log('isReminderSent', isReminderSent)

  if (isReminderSent) {
    // Jika sudah ada pengingat, maka kirim pesan ke pengguna
    return res.json({ message: 'Already sent before' })
  }

  // jika belum ada pengingat, maka kirim pengingat ke grup dan topic yang memiliki type 'daily_report'

  // kirim pesan ke grup dan topic yang memiliki type 'daily_report'
  groups.forEach(group => {
    const { id: groupId } = group
    const topics = group.topics.filter(topic => topic.type === 'daily_report')
    topics.forEach(topic => {
      const { id: topicId } = topic

      let messageText = 'Halo ges, jangan lupa laporan harian ya!'

      // cek apakah ada member yang belum laporan harian
      if (memberIdsWithoutdailyReportLog.length > 0) {
        // tambahkan nama member ke pesan
        messageText += '\n\nMember yang belum laporan harian:'

        console.log('groupId', groupId)

        memberIdsWithoutdailyReportLog.forEach(memberId => {
          const findMember = members.find(member => member.id === memberId && member.group_id === groupId)
          if (!findMember) return
          const { first_name: firstName, last_name: lastName, username } = findMember
          const memberName = `${firstName}${lastName !== '' ? ' ' + lastName : ''} ${username ? `(@${username})` : ''}`
          messageText += `\n- ${memberName}`
        })
      }

      console.log('messageText', messageText)

      const message = bot.sendMessage(groupId, messageText, {
        parse_mode: 'HTML',
        reply_to_message_id: null
      })

      // tambahkan log pengingat ke log
      // eslint-disable-next-line no-unreachable
      logReminders.push({
        type: reminderType,
        message_id: message.message_id,
        group_id: groupId,
        for_member_id: null,
        topic_id: topicId,
        content: messageText,
        created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        time: moment().format('HH:mm:ss'),
        timezone: 'Asia/Jakarta'
      })

      // simpan log ke database/logs.json
      updateLogDatabase(currentDate, 'reminders', logReminders)

      // delete message
      //   setTimeout(() => {
    //   bot.deleteMessage(groupId, message.message_id)
    //   }, 1000 * 60 * 60 * 2)
    })
  })

  res.json({ message: 'Reminder sent' })
}
