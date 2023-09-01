const express = require('express')
const TelegramBot = require('node-telegram-bot-api')
const telegramConfig = require('./configs/telegramConfig')
const corsMiddleware = require('./middlewares/corsMiddleware')
const apiRoutes = require('./routes/api')
const telegramBot = require('./telegram/init')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(corsMiddleware)

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

app.use('/api', apiRoutes)

const bot = new TelegramBot(telegramConfig.token, { polling: true })
telegramBot.init(bot)

// add bot to request object
app.use((req, res, next) => {
  req.bot = bot
  next()
})

app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`)
})
