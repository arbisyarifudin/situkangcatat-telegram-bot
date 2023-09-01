// cron group routes
// Path: src/routes/cron.js

const express = require('express')
const router = express.Router()

// cron job to send message to reminder to clock-in/clock-out to all groups
router.get('/send-attendance-reminder', require('../controllers/sendAttendanceReminder'))

module.exports = router
