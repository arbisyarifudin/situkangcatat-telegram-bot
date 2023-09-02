// Path: src/routes/cron.js

const express = require('express')
const router = express.Router()

// send message to remind attendance to all groups that are allowed
router.get('/send-attendance-reminder', require('../controllers/sendAttendanceReminder'))

// send message to remind daily report to all groups that are allowed
router.get('/send-daily-report-reminder', require('../controllers/sendDailyReportReminder'))

module.exports = router
