'use strict'

const dotenv = require('dotenv')
const assert = require('assert')

dotenv.config()

const { env } = process

const config = {
  env: env.NODE_ENV || 'development',
  mode: env.MODE || 'development',
  port: env.PORT || 5001,
  port2: env.PORT2 || 5002,
  host: env.HOST || 'localhost',
  baseUrl: env.BASE_URL || 'http://localhost:5001',
  webhookKey: env.WEBHOOK_KEY || '112233',
  ci4ApiUrl: env.CI4_API_URL || 'http://localhost:8080',
  ci4Token: env.CI4_TOKEN || '123456',
  rootPath: env.ROOT_PATH || __dirname,
  wa: {
    autoStartSession: env.WA_AUTO_START_SESSION || 'false',
    authPath: env.WA_AUTH_PATH || '.wwebjs_auth',
    showQRInTerminal: env.WA_SHOW_QR_IN_TERMINAL || 'false',
    useRemoteAuth: env.WA_USE_REMOTE_AUTH || 'false',
    remoteAuthStorageDir: env.WA_REMOTE_AUTH_STORAGE_DIR || 'auth'
  },
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
    region: env.AWS_REGION || '',
    bucketName: env.AWS_BUCKET_NAME || '',
    bucketFilePath: env.MODE === 'production' ? 'CRM' : 'CRM-dev'
  },
  db: {
    database: env.DB_NAME || 'database',
    username: env.DB_USER || 'postgres',
    password: env.DB_PASS || 'root',
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT || '54362',
    dialect: env.DB_DIALECT || 'postgres'
  },
  useHttps: env.USE_HTTPS || 'false',
  sslKeyPath: env.SSL_KEY_PATH || '',
  sslCertPath: env.SSL_CERT_PATH || ''
}

assert(config.env === 'development' || config.env === 'production', 'NODE_ENV must be either development or production')
assert(config.host, 'HOST must be set')
assert(config.port, 'PORT must be set')
assert(config.ci4ApiUrl, 'CI4_API_URL must be set')

module.exports = config
