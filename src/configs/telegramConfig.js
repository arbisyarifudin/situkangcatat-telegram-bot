require('dotenv').config()

// const eventTypes = [
//   'attendance', // untuk handle masalah presensi
//   'daily_report' // untuk handle masalah laporan harian
// ]

// get group data from json file
const groups = require('../../databases/groups.json')

module.exports = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  allowedGroups: groups
}
