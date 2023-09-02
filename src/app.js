const express = require('express')
const TelegramBot = require('node-telegram-bot-api')
const telegramConfig = require('./configs/telegramConfig')
const corsMiddleware = require('./middlewares/corsMiddleware')
const routes = require('./routes/index')
const telegramBot = require('./telegram/init')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(corsMiddleware)

// add bot to request object
app.use((req, res, next) => {
  req.bot = bot
  next()
})

app.use('/', routes)

const bot = new TelegramBot(telegramConfig.token, { polling: true })
telegramBot.init(bot)

app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`)
})
