const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const https = require('https')

// Ganti dengan token bot Anda
const token = '6263342264:AAGD2S5RRlPATHW10OKHKFDr0SDMLJ8Pg8g'

// ID grup yang diizinkan
const allowedGroup = [
  {
    id: -1001812257489,
    topicIds: [23]
  }
]

// Inisialisasi bot
const bot = new TelegramBot(token, { polling: true })

// Mendengarkan pesan masuk
bot.on('message', async (msg) => {
  console.log('message', msg)

  const messageId = msg.message_id
  const chatId = msg.chat.id
  const threadId = msg.message_thread_id

  // Cek apakah pesan masuk dari grup yang diizinkan
  const isAllowedGroup = allowedGroup.some(group => {
    return group.id === chatId && group.topicIds.includes(threadId)
  })

  console.log('isAllowedGroup', isAllowedGroup)

  if (!isAllowedGroup) return

  let msgText
  if (msg.text) {
    msgText = msg.text.toLowerCase()
  } else {
    msgText = msg.caption ? msg.caption.toLowerCase() : ''
  }

  if (msgText) {
    const validKeywords = ['absen masuk', 'absen keluar', 'masuk', 'keluar']

    if (validKeywords.some(keyword => msgText.includes(keyword))) {
      if (msg.photo && msg.photo.length > 0) {
        // Jika terdapat foto dalam pesan
        const photoId = msg.photo[msg.photo.length - 1].file_id

        try {
          const photoPath = await downloadPhoto(photoId)
          console.log('photoPath', photoPath)
          // Lakukan validasi tambahan jika diperlukan

          // Kirim pesan sukses
          bot.sendMessage(chatId, 'Kehadiran berhasil dicatat.', {
            reply_to_message_id: messageId
          })
        } catch (error) {
          console.log('error', error)
        }
      } else {
        // Kirim pesan error jika tidak ada foto
        bot.sendMessage(chatId, 'Error: Mohon sertakan foto dalam pesan.', {
          reply_to_message_id: messageId
        })
      }
    } else {
      // Kirim pesan error jika format kata kunci salah
      bot.sendMessage(chatId, 'Error: Format pesan salah. Gunakan salah satu dari: Absen Masuk, Absen Keluar, Masuk, Keluar.', {
        reply_to_message_id: messageId
      })
    }
  } else {
    // Kirim pesan error jika tidak ada teks
    bot.sendMessage(chatId, 'Error: Mohon sertakan teks dalam pesan.', {
      reply_to_message_id: messageId
    })
  }
})

// Fungsi untuk mengunduh foto dari pesan
function downloadPhoto (fileId) {
  return new Promise((resolve, reject) => {
    bot.getFileLink(fileId).then(link => {
      const fileExtension = link.substring(link.lastIndexOf('.'))

      // get current date (format: YYYY-MM-DD like 2021-01-01)
      const date = new Date()
      const dateString = date.toISOString().split('T')[0]

      // get current datetime (format: YYYY-MM-DD_HH-mm-ss like 2021-01-01_12-30-00)
      const dateTimeString = date.toISOString().replace(/:/g, '-').split('.')[0]

      // generate file name
      const fileName = `${dateTimeString}_${fileId}${fileExtension}`
      const filePath = `downloads/${dateString}/${fileName}` // Ganti dengan direktori penyimpanan yang diinginkan

      // create path if not exists
      if (!fs.existsSync(`downloads/${dateString}`)) {
        fs.mkdirSync(`downloads/${dateString}`, { recursive: true })
      }

      const fileStream = fs.createWriteStream(filePath)
      const request = https.get(link, response => {
        response.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          resolve(filePath)
        })
      })

      request.on('error', err => {
        reject(err)
      })
    }).catch(err => {
      reject(err)
    })
  })
}
