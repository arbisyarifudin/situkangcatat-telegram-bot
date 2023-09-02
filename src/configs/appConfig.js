require('dotenv').config()

module.exports = {
  env: process.env.NODE_ENV || 'development',
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 3000,
  cronPassword: process.env.CRON_PASSWORD || '123456'
}
