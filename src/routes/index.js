// Path: src/routes/index.js

const express = require('express')
const router = express.Router()

// Rute dasar
router.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

// Rute API, mengimpor dari api.js
router.use('/api', require('./api'))

// Rute Cron, mengimpor dari cron.js
router.use('/cron', require('./cron'))

// Middleware error handler
router.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Terjadi kesalahan dalam server' })
})

module.exports = router
