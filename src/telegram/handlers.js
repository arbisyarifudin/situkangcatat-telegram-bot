const moment = require('moment')
require('moment-timezone')

const { downloadPhoto, isValidReportFormat, __handleCommand, listSupportedCommandText, invalidParamsText } = require('./helpers')
const { saveToCSV } = require('./helpers')
const supportedCommands = require('../../databases/commands.json')

module.exports = {
  attendanceHandler: async (bot, msg) => {
    // console.log('attendanceHandler msg', msg)
    const messageId = msg.message_id
    const chatId = msg.chat.id
    // const threadId = msg.message_thread_id

    let msgText
    if (msg.text) {
      msgText = msg.text
    } else {
      msgText = msg.caption ? msg.caption : ''
    }

    if (msgText) {
      const validKeywords = ['masuk', 'pulang', 'izin', 'sakit', 'cuti']
      const messageTextLowerCase = msgText.toLowerCase()

      if (validKeywords.some(keyword => messageTextLowerCase.includes(keyword))) {
        if (msg.photo && msg.photo.length > 0) {
          // Jika terdapat foto dalam pesan
          const photoId = msg.photo[msg.photo.length - 1].file_id

          try {
            // Lakukan validasi tambahan jika diperlukan

            // Unduh foto dari pesan
            /* const photoPath =  */await downloadPhoto(bot, photoId)
            //   console.log('photoPath', photoPath)

            // Ambil status dari pesan
            const status = messageTextLowerCase.includes('izin') ? 'Izin' : messageTextLowerCase.includes('sakit') ? 'Sakit' : messageTextLowerCase.includes('cuti') ? 'Cuti' : messageTextLowerCase.includes('masuk') ? 'Masuk' : 'Pulang'

            // Ambil tanggal dan waktu dari pesan
            const dateObj = new Date(msg.date * 1000)
            const date = moment(dateObj).tz('Asia/Jakarta') // Menggunakan zona waktu Asia/Jakarta

            // Format tanggal dan waktu menjadi string
            const dateTimeString = date.format('YYYY-MM-DD HH:mm:ss')
            const dayName = date.format('dddd') // Nama hari dalam bahasa Indonesia

            //   const photUrl = `${baseURL}/${photoPath}`

            // Ambil username dari pesan
            const username = `@${msg.from.username}`

            const note = ''

            // Ambil informasi dari msg untuk dimasukkan ke dalam file CSV
            //   const rowData = [msg.from.username, status, dateString, photUrl]
            const rowData = [username, status, note, dateTimeString, msgText]

            const dateFileName = date.format('YYYY-MM-DD') // format: YYYY-MM-DD
            saveToCSV([rowData], `datas/attendance-${dateFileName}.csv`)

            const successMessageText = `<b>Sip!</b> Kehadiran berhasil dicatat.\n\n<code>Username: ${username}\nStatus: ${status}\nTimestamp: ${dayName}, ${dateTimeString} WIB</code>`

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
          bot.sendMessage(chatId, '<b>Ups!</b> Mohon sertakan foto dalam pesan.', {
            parse_mode: 'HTML',
            reply_to_message_id: messageId
          })
        }
      } else {
        // if (msgText.includes('/presensi')) {
        //   // cari command yang sesuai
        //   const selectedCommand = supportedCommands.find((cmd) => cmd.command === '/presensi')
        //   if (!selectedCommand) return

        //   const splitedText = msgText.split(' ')
        //   //   const command = splitedText[0] // Mengambil perintah (misal: /presensi)
        //   const args = splitedText.length > 1 ? splitedText.slice(1) : [] // Mengambil argumen setelah perintah
        //   const user = msg.from // Mengambil informasi pengirim pesan

        //   // Memeriksa apakah jumlah argumen sesuai
        //   if (args.length < selectedCommand.params.filter((param) => param.is_required).length) {
        //     bot.sendMessage(
        //       chatId, invalidParamsText(selectedCommand), {
        //         parse_mode: 'MarkdownV2'
        //       }
        //     )
        //   } else {
        //     // Eksekusi perintah
        //     __handleCommand(bot, msg, selectedCommand, args, user, chatId)
        //   }
        // } else {
        //   // Kirim pesan error jika format kata kunci salah
        //   bot.sendMessage(chatId, `<b>Ups!</b> Format kata kunci salah.\n\nGunakan: <code>${validKeywords.join(', ')}</code>`, {
        //     parse_mode: 'HTML',
        //     reply_to_message_id: messageId
        //   })
        // }

        if (msgText && !msgText.startsWith('/')) {
          // Kirim pesan error jika format kata kunci salah
          const invalidKeywordText = `<b>Ups!</b> Format kata kunci salah.\n\nGunakan: <code>${validKeywords.join(', ')}</code>\n\nAtau gunakan perintah <code>/presensi</code> untuk mencatat presensi.`

          bot.sendMessage(chatId, invalidKeywordText, {
            parse_mode: 'HTML',
            reply_to_message_id: messageId
          })
        }
      }
    } else {
      // Kirim pesan error jika tidak ada teks
      bot.sendMessage(chatId, '<b>Ups!</b> Mohon sertakan teks dalam pesan.', {
        parse_mode: 'HTML',
        reply_to_message_id: messageId
      })
    }
  },
  dailyReportHandler: (bot, msg) => {
    // console.log('dailyReportHandler msg', msg)

    // format pesan daily report:
    // eslint-disable-next-line no-unused-vars
    const formatPesan = `Laporan Harian [DD/MMM/YYYY]

Nama: [Nama Anda]

Yang sudah di kerjakan kemarin:
- [Tugas 1]
- [Tugas 2]
- dst...

Kendala (jika ada) :
- [Kendala 1]
- [Kendala 2]
- dst...

Todo/Yang akan di kerjakan hari ini :
- [Tugas 1]
- [Tugas 2]
- dst...`

    // Note:
    // - daily report hanya dilakukan di jam 07-10 pagi setiap hari senin-sabtu
    // - daily report hanya bisa dilakukan di grup yang sudah ditentukan
    // - pesan daily report harus mengandung kata kunci "report harian" atau "daily report" dengan format yang sudah ditentukan di atas
    // - pesan daily report yang diluar ketentuan tidak akan ditanggapi oleh bot, namun jika mengandung kata kunci "report harian" atau "daily report" maka bot akan mengirimkan pesan error yang berisi format yang benar

    const messageId = msg.message_id
    const chatId = msg.chat.id
    // const threadId = msg.message_thread_id

    let msgText
    if (msg.text) {
      msgText = msg.text
    } else {
      msgText = msg.caption ? msg.caption : ''
    }

    const msgTextLowerCase = msgText.toLowerCase()

    if (msgText) {
      const validKeywords = ['report harian', 'daily report', 'laporan harian']

      if (validKeywords.some(keyword => msgTextLowerCase.includes(keyword))) {
        const dateObj = new Date(msg.date * 1000)
        const date = moment(dateObj).tz('Asia/Jakarta') // Menggunakan zona waktu Asia/Jakarta
        const hour = date.hour()
        const dayName = date.format('dddd') // Nama hari dalam bahasa Indonesia

        // cek apakah pesan dikirim di jam 07-21 WIB, jika tidak maka bot akan mengirimkan pesan error
        if (hour < 7 || hour > 21 || dayName === 'Minggu') {
          bot.sendMessage(chatId, '<b>Wah</b>, harusnya daily report dilakukan di jam 07 pagi - 21 malam dan setiap hari Senin-Sabtu saja, Bro.', {
            parse_mode: 'HTML',
            reply_to_message_id: messageId
          })

          return
        }

        // cek apakah pesan sudah sesuai dengan format yang ditentukan, jika tidak maka bot akan mengirimkan pesan error
        if (!isValidReportFormat(msgText)) {
          bot.sendMessage(chatId, `<b>Ups!</b> Format <b>Laporan Harian</b> salah.\n\nGunakan:\n\n<code>${formatPesan}</code>`, {
            parse_mode: 'HTML',
            reply_to_message_id: messageId
          })
        }

        // delete message
        // bot.deleteMessage(chatId, messageId)
      }
    }
  },
  commandHandler: (bot, msg) => {
    // console.log('commandHandler msg', msg)

    let msgText
    if (msg.text) {
      msgText = msg.text
    } else {
      msgText = msg.caption ? msg.caption : ''
    }

    const chatId = msg.chat.id
    const splitedText = msgText.split(' ')
    const command = splitedText[0] // Mengambil perintah (misal: /presensi)
    const args = splitedText.length > 1 ? splitedText.slice(1) : [] // Mengambil argumen setelah perintah
    const user = msg.from // Mengambil informasi pengirim pesan

    // Mencari perintah yang sesuai
    const selectedCommand = supportedCommands.find((cmd) => cmd.command === command)

    if (selectedCommand) {
      // Memeriksa apakah jumlah argumen sesuai
      if (args.length < selectedCommand.params.filter((param) => param.is_required).length) {
        return bot.sendMessage(
          chatId, invalidParamsText(selectedCommand), {
            parse_mode: 'MarkdownV2',
            reply_to_message_id: msg.message_id
          }
        )
      } else {
        // Eksekusi perintah
        return __handleCommand(bot, msg, selectedCommand, args, user, chatId)
      }
    } else {
      return bot.sendMessage(chatId, listSupportedCommandText(supportedCommands), {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: msg.message_id
      })
    }
  }
}
