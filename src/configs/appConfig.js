require('dotenv').config()

module.exports = {
  cronPassword: process.env.CRON_PASSWORD || '123456'
}
