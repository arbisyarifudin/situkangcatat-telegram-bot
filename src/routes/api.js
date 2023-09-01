const express = require('express')
const router = express.Router()

router.get('/ping', (req, res) => {
  res.json({ message: 'Pong from API!' })
})

// router group for /cron
router.use('/cron', require('./cron'))

module.exports = router
