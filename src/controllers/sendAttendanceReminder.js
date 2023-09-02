// Path: src/controllers/sendAttendanceReminder.js
const moment = require('moment')
require('moment-timezone')
// require('moment/locale/id')
require('moment/locale/id')
moment.locale('id')

const { allowedGroups } = require('../configs/telegramConfig')
const appConfig = require('../configs/appConfig')
const { getLogDatabase, updateLogDatabase, getMemberData } = require('../telegram/helpers')

module.exports = async (req, res) => {
//   console.log('Sending attendance reminder...')

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

  // ambil group dan topic yang memiliki type 'attendance'
  const groups = allowedGroups.filter(group => group.topics.find(topic => topic.type === 'attendance'))

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
  //   const isTimeToSend = true
  const isTimeToSend = parseInt(currentHour) >= 7 && parseInt(currentHour) <= 16

  if (!isTimeToSend) {
    // Jika bukan waktu yang ditentukan, maka kirim response API
    return res.json({ message: 'Not time yet' })
  }

  if (currentDay.toLowerCase() === 'minggu') {
    // Jika hari Minggu, maka kirim response API
    return res.json({ message: 'It\'s Sunday' })
  }

  // cek apakah ada member yang belum presensi masuk atau pulang
  const members = getMemberData(groupIds)
  //   console.log('members', members)

  // attendance logs for today
  const attendanceLogs = getLogDatabase(currentDate, 'attendances')
  //   console.log('attendanceLogs', attendanceLogs)

  // get all member id
  const memberIds = members.map(member => member.id)
  //   console.log('memberIds', memberIds)

  // get all attendance log for today
  const attendanceLogsForToday = attendanceLogs.filter(log => memberIds.includes(log.member_id))

  //   console.log('attendanceLogsForToday', attendanceLogsForToday)

  // get all member id that has attendance log for today
  const memberIdsWithAttendanceLog = attendanceLogsForToday.map(log => log.member_id)

  //   console.log('memberIdsWithAttendanceLog', memberIdsWithAttendanceLog)

  // get all member id that has no attendance log for today
  const memberIdsWithoutAttendanceLog = memberIds.filter(memberId => !memberIdsWithAttendanceLog.includes(memberId))

  //   console.log('memberIdsWithoutAttendanceLog', memberIdsWithoutAttendanceLog)

  if (memberIdsWithoutAttendanceLog.length === 0) {
    // Jika semua member sudah presensi, maka kirim response API
    return res.json({ message: 'All members have attendance log' })
  }

  // get reminder type (attendance_clockin or attendance_clockout)
  const reminderType = `attendance${currentHour === '07' ? '_clockin' : currentHour === '15' ? '_clockout' : ''}`

  // cek apakah sudah ada pengingat daily report di log untuk hari ini
  const isReminderSent = logReminders.find(reminder => reminder.type === reminderType)
  //   console.log('isReminderSent', isReminderSent)
  //   if (isReminderSent) {
  //     // Jika sudah ada pengingat, maka kirim pesan ke pengguna
  //     return res.json({ message: 'Already sent before' })
  //   }

  if (isReminderSent) {
    // Cek apakah reminder sudah di kirim dalam 2 jam lalu?
    // jika masih dalam 2 jam, maka jangan kirim pengingat
    const isReminderSentInLast2Hours = moment().diff(moment(isReminderSent.created_at), 'hours') < 2

    if (isReminderSentInLast2Hours) {
      return res.json({ message: 'Already sent before' })
    }
  }

  // jika belum ada pengingat, maka kirim pengingat ke grup dan topic yang memiliki type 'attendance'

  // kirim pesan ke grup dan topic yang memiliki type 'attendance'
  groups.forEach(group => {
    const { id: groupId } = group
    const topics = group.topics.filter(topic => topic.type === 'attendance')
    topics.forEach(topic => {
      const { id: topicId } = topic

      let attendanceTypeLabel = ''

      // jika jam dibawah jam 8, maka kirim pesan untuk presensi masuk
      // jika jam diatas jam 8 dan dibawah jam 16, maka kirim pesan untuk presensi pulang

      if (currentHour === '07' || (parseInt(currentHour) > 7 && parseInt(currentHour) < 8)) {
        attendanceTypeLabel = 'masuk'
      } else if (currentHour === '15' || (parseInt(currentHour) > 15 && parseInt(currentHour) < 16)) {
        attendanceTypeLabel = 'pulang'
      }

      let messageText = `Halo ges, jangan lupa presensi ${attendanceTypeLabel} ya!`

      // cek apakah ada member yang belum presensi masuk atau pulang
      if (memberIdsWithoutAttendanceLog.length > 0) {
        // tambahkan nama member ke pesan
        messageText += '\n\nMember yang belum presensi:'

        memberIdsWithoutAttendanceLog.forEach(memberId => {
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
