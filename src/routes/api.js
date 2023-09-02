// Path: src/routes/api.js

const express = require('express')
const router = express.Router()

router.get('/ping', (req, res) => {
  res.json({ message: 'Pong from API!' })
})

module.exports = router
