require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const https = require('https')
const fs = require('fs')

// const baseURL = process.env.BASE_URL || 'http://localhost:3000'

// Ganti dengan token bot Anda
const token = process.env.TELEGRAM_BOT_TOKEN

// ID grup yang diizinkan
const allowedGroup = [
  {
    id: -1001812257489, // ID grup di Telegram (ganti dengan ID grup Anda)
    topicIds: [23] // ID topik di grup (ganti dengan ID topik Anda)
  }
]

// Inisialisasi bot
const bot = new TelegramBot(token, { polling: true })

// Mendengarkan pesan masuk
bot.on('message', async (msg) => {
//   console.log('message', msg)

  const messageId = msg.message_id
  const chatId = msg.chat.id
  const threadId = msg.message_thread_id

  // Cek apakah pesan masuk dari grup yang diizinkan
  const isAllowedGroup = allowedGroup.some(group => {
    return group.id === chatId && group.topicIds.includes(threadId)
  })

  if (!isAllowedGroup) return

  let msgText
  if (msg.text) {
    msgText = msg.text.toLowerCase()
  } else {
    msgText = msg.caption ? msg.caption.toLowerCase() : ''
  }

  if (msgText) {
    const validKeywords = ['masuk', 'pulang', 'izin', 'sakit', 'cuti']

    if (validKeywords.some(keyword => msgText.includes(keyword))) {
      if (msg.photo && msg.photo.length > 0) {
        // Jika terdapat foto dalam pesan
        const photoId = msg.photo[msg.photo.length - 1].file_id

        try {
          // Lakukan validasi tambahan jika diperlukan

          // Unduh foto dari pesan
          /* const photoPath =  */await downloadPhoto(photoId)
          //   console.log('photoPath', photoPath)

          // Ambil status dari pesan
          const status = msgText.includes('izin') ? 'Izin' : msgText.includes('sakit') ? 'Sakit' : msgText.includes('cuti') ? 'Cuti' : msgText.includes('masuk') ? 'Masuk' : 'Pulang'

          // Ambil tanggal dan waktu dari pesan
          const date = new Date(msg.date * 1000) // Konversi dari UNIX Timestamp ke Date

          // Buat tanggal dan waktu jadi GMT+7
          const dateString = date.toLocaleDateString('id-ID')
          const timeString = date.toLocaleTimeString('id-ID').replace(/\./g, ':')
          const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' })

          // add leading zero to single digit
          const dateTimeString = `${dateString} ${timeString}`.replace(/(?<!\d)(\d)(?!\d)/g, '0$1')

          //   const photUrl = `${baseURL}/${photoPath}`

          // Ambil username dari pesan
          const username = `@${msg.from.username}`

          // Ambil informasi dari msg untuk dimasukkan ke dalam file CSV
          //   const rowData = [msg.from.username, status, dateString, photUrl]
          const rowData = [username, status, msgText, dateTimeString]

          const dateFileName = date.toISOString().split('T')[0] // format: YYYY-MM-DD
          saveToCSV([rowData], `datas/attendance-${dateFileName}.csv`)

          const successMessageText = `Kehadiran berhasil dicatat.\n\n<code>Username: ${username}\nStatus: ${status}\nTimestamp: ${dayName}, ${dateTimeString} WIB</code>`

          // Kirim pesan sukses
          bot.sendMessage(chatId, successMessageText, {
            parse_mode: 'HTML',
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
      bot.sendMessage(chatId, `Error: Format kata kunci salah.\n\nGunakan: <code>${validKeywords.join(', ')}</code>`, {
        parse_mode: 'HTML',
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

      // Hapus folder yang bukan bulan ini
      const currentMonth = date.getMonth()
      const currentYear = date.getFullYear()
      const currentMonthString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
      const downloadsPath = 'downloads'
      const folders = fs.readdirSync(downloadsPath)
      folders.forEach(folder => {
        // check if folder has name like YYYY-MM
        if (folder.match(/^\d{4}-\d{2}$/)) {
          // get folder year and month
          const folderYear = folder.split('-')[0]
          const folderMonth = folder.split('-')[1]

          // delete folder if not current year month
          const folderYearMonthString = `${folderYear}-${folderMonth}`
          if (folderYearMonthString !== currentMonthString) {
            fs.rmdirSync(`${downloadsPath}/${folder}`, { recursive: true })
          }
        }
      })
    }).catch(err => {
      reject(err)
    })
  })
}

const headerTitles = ['Nama', 'Status', 'Pesan', 'Tanggal']

function saveToCSV (data, fileName, folder = 'datas') {
  // Membuat direktori jika belum ada
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
  }

  // Membuat file CSV baru jika belum ada
  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, headerTitles.join(',') + '\n', 'utf-8')
  }

  // Mengonversi data presensi ke dalam baris-baris CSV
  const rows = data.map(row => {
    return row.join(',')
  })

  // Menggabungkan baris-baris data dengan file CSV yang sudah ada
  fs.appendFileSync(fileName, rows.join('\n') + '\n', 'utf-8')

//   console.log(`Data presensi telah ditambahkan ke dalam file ${fileName}`)
}
