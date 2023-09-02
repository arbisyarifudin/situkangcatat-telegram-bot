const fs = require('fs')
const https = require('https')

const moment = require('moment')
require('moment-timezone')
// require('moment/dist/locale/id')
require('moment/locale/id')
moment.locale('id')

const headerTitles = ['Nama', 'Status', 'Keterangan', 'Tanggal', 'Pesan']

const saveToCSV = (data, fileName, folder = 'datas') => {
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

const saveAttendanceToJSONFile = (msg, { status, note }) => {
  // current date (format: YYYY-MM-DD)
  const date = moment().tz('Asia/Jakarta')
  const currentDate = date.format('YYYY-MM-DD')
  const dateTimeString = date.format('YYYY-MM-DD HH:mm:ss')

  // Ambil semua data logs
  const logs = require('../../databases/logs.json')

  //   console.log('logs', logs)

  // temukan log yang sesuai dengan tanggal
  let log = logs.find(log => log.date === currentDate)
  if (!log) {
    // Jika log tidak ditemukan, maka buat log baru
    logs.push({
      date: currentDate,
      attendances: []
    })

    // temukan log yang sesuai dengan tanggal
    log = logs.find(log => log.date === currentDate)
  }

  const logAttendances = log.attendances

  // tambahkan data presensi ke dalam log
  logAttendances.push({
    message_id: msg.message_id,
    member_id: msg.from.id,
    status: status.toLowerCase(),
    note,
    created_at: dateTimeString,
    time: date.format('HH:mm:ss'),
    timezone: 'Asia/Jakarta'
  })

  // Simpan log ke dalam database/logs.json

  // Membuat direktori jika belum ada
  if (!fs.existsSync('databases')) {
    fs.mkdirSync('databases', { recursive: true })
  }

  fs.writeFileSync('databases/logs.json', JSON.stringify(logs, null, 2), 'utf-8')
}

// Helper: teks yang akan dikirimkan jika format pesan tidak sesuai
// berisi daftar command dan parameter yang didukung serta penjelasan / description nya
const listSupportedCommandText = (supportedCommands) => {
  // output:
  // **Perintah tidak valid.**
  //
  // **Daftar Perintah:**
  // - ``/presensi <jenis> <keterangan>`` - Mencatat presensi
  // - ``/laporan-presensi <tahun> <bulan>`` - Menampilkan laporan presensi

  const text = `**Perintah tidak valid.**\n\n**Daftar Perintah:**\n${supportedCommands.map((command) => `- \`${command.command} ${command.params.map((param) => `<${param.name}>`).join(' ')}\` - ${command.description}`).join('\n')}`

  const escapedText = text
    .replace(/\./g, '\\.')
    .replace(/-/g, '\\-')
    // .replace(/</g, '[')
    // .replace(/>/g, ']')

  //   console.log('listSupportedCommandText', escapedText)

  return escapedText
}

// Helper: teks yang akan dikirimkan jika jumlah parameter tidak sesuai
// berisi daftar parameter yang didukung serta penjelasan / description nya
const invalidParamsText = (command) => {
  // output:
  // Perintah ``/presensi`` memerlukan lebih banyak parameter.
  // Gunakan ``/presensi <jenis> <keterangan>``.
  //
  // Berikut adalah daftar parameter yang didukung:
  // - ``<jenis>`` : description
  // - ``<keterangan>`` : description (tidak wajib)

  const commandName = command.command // /presensi
  const params = command.params //  [{ name: 'jenis', description: 'description', is_required: true }, { name: 'keterangan', description: 'description', is_required: false }]

  const text = `Perintah \`${commandName}\` memerlukan lebih banyak parameter.\nGunakan \`${commandName} ${params.map((param) => `<${param.name}>`).join(' ')}\`.\n\nBerikut adalah daftar parameter yang didukung:\n${params.map((param) => `- \`${param.name}\` : ${param.description} ${param.is_required ? '' : '(TIDAK WAJIB)'}`).join('\n')}`

  const escapedText = text
    .replace(/\./g, '\\.')
    .replace(/-/g, '\\-')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // .replace(/</g, '[')
    // .replace(/>/g, ']')

  //   console.log('invalidParamsText', escapedText)

  return escapedText
}

const getMemberData = (groupId = null, memberId = null) => {
  // Ambil semua data groups
  const groups = require('../../databases/groups.json')

  if (!groupId) {
    // Jika tidak ada groupId, maka kembalikan semua data member dari semua group
    const members = []

    // Ambil semua data members dari semua group
    groups.forEach(group => {
      const groupMembers = group.members || []
      groupMembers.group_id = group.id
      members.push(...groupMembers)
    })

    return members
  }

  let members = []

  // cek if groupId is array
  if (Array.isArray(groupId)) {
    // Ambil semua data members dari semua group
    groups.forEach(group => {
      if (groupId.includes(group.id)) {
        const groupMembers = group.members || []

        // tambah group_id ke dalam data tiap member
        groupMembers.forEach(member => {
          member.group_id = group.id
        })

        members.push(...groupMembers)
      }
    })
  } else {
    // temukan group yang sesuai dengan id
    const group = groups.find(group => group.id === groupId)

    // Ambil semua data members dari group
    members = group.members || []

    // tambah group_id ke dalam data tiap member
    members.forEach(member => {
      member.group_id = group.id
    })
  }

  if (!memberId) {
    // Jika tidak ada memberId, maka kembalikan semua data member dari group
    return members
  }

  // temukan member yang sesuai dengan id
  const member = members.find(member => member.id === memberId)

  return member
}

const getLogDatabase = (date = null, type = null) => {
  // Ambil semua data logs
  const logs = require('../../databases/logs.json')

  if (!date) {
    return logs
  }

  // temukan log yang sesuai dengan tanggal
  let log = logs.find(log => log.date === date)

  if (!log) {
    // Jika log tidak ditemukan, maka buat log baru
    logs.push({
      date,
      reminders: [],
      attendances: [],
      daily_reports: []
    })

    // temukan log yang sesuai dengan tanggal
    log = logs.find(log => log.date === date)
  }

  if (!type) {
    return log
  }

  let logData = log[type]

  if (!logData) {
    // Jika log tidak ditemukan, maka buat log baru
    log[type] = []
    logData = log[type]
  }

  return logData
}

const updateLogDatabase = (date, type = 'attendance', data) => {
  // Ambil semua data logs
  const logs = require('../../databases/logs.json')

  // temukan log yang sesuai dengan tanggal
  let log = logs.find(log => log.date === date)

  if (!log) {
    // Jika log tidak ditemukan, maka buat log baru
    logs.push({
      date,
      reminders: [],
      attendances: [],
      daily_reports: []
    })

    // temukan log yang sesuai dengan tanggal
    log = logs.find(log => log.date === date)
  }

  log[type] = data

  // update logs dengan log yang sudah diupdate
  logs[logs.findIndex(log => log.date === date)] = log

  // Simpan log ke dalam database/logs.json

  // Membuat direktori jika belum ada
  if (!fs.existsSync('databases')) {
    fs.mkdirSync('databases', { recursive: true })
  }

  fs.writeFileSync('databases/logs.json', JSON.stringify(logs, null, 2), 'utf-8')

  return log
}

module.exports = {

  saveToCSV,
  saveAttendanceToJSONFile,
  getLogDatabase,
  updateLogDatabase,
  getMemberData,

  // Fungsi untuk mengunduh foto dari pesan
  downloadPhoto: (bot, fileId) => {
    return new Promise((resolve, reject) => {
      bot.getFileLink(fileId).then(link => {
        const fileExtension = link.substring(link.lastIndexOf('.'))

        // Mendapatkan tanggal saat ini (format: YYYY-MM-DD seperti 2021-01-01)
        const currentDate = moment().format('YYYY-MM-DD')

        // Mendapatkan tanggal dan waktu saat ini (format: YYYY-MM-DD_HH-mm-ss seperti 2021-01-01_12-30-00)
        const currentDateTime = moment().format('YYYY-MM-DD_HH-mm-ss')

        // generate file name
        const fileName = `${currentDateTime}_${fileId}${fileExtension}`
        const filePath = `downloads/${currentDate}/${fileName}` // Ganti dengan direktori penyimpanan yang diinginkan

        // create path if not exists
        if (!fs.existsSync(`downloads/${currentDate}`)) {
          fs.mkdirSync(`downloads/${currentDate}`, { recursive: true })
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
        const currentMonth = moment().month()
        const currentYear = moment().year()
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
  },

  isValidReportFormat: (text) => {
    // Konversi teks ke huruf kecil agar tidak case-sensitive
    const lowercaseText = text.toLowerCase()

    // Mencari keberadaan kata kunci kunci dalam teks
    const keywords = [
      'report harian',
      'nama:',
      'yang sudah dikerjakan kemarin:',
      'kendala (jika ada):',
      'todo/yang akan dikerjakan hari ini:'
    ]

    const keywordsAlternative = [
      {
        keyword: 'report harian',
        alternatives: ['laporan harian', 'daily report']
      },
      {
        keyword: 'nama:',
        alternatives: ['nama', 'name:', 'name']
      },
      {
        keyword: 'yang sudah dikerjakan kemarin:',
        alternatives: ['yang sudah dikerjakan', 'yang sudah dikerjakan kemarin', 'yang sudah dikerjakan kemarin:', 'yang sudah dikerjakan kemarin :', 'yang sudah dikerjakan :']
      },
      {
        keyword: 'kendala (jika ada):',
        alternatives: ['kendala (jika ada)', 'kendala (jika ada) :', 'kendala (jika ada):', 'kendala (jika ada) :', 'kendala', 'kendala:', 'kendala :']
      },
      {
        keyword: 'todo/yang akan dikerjakan hari ini:',
        alternatives: ['todo', 'todo :', 'yang akan dikerjakan', 'yang akan dikerjakan hari ini', 'yang akan dikerjakan hari ini:', 'yang akan dikerjakan hari ini :', 'yang akan dikerjakan :', 'yang akan di kerjakan hari ini', 'yang akan di kerjakan hari ini:', 'yang akan di kerjakan hari ini :', 'yang akan di kerjakan :']
      }
    ]

    for (const keyword of keywords) {
      if (!lowercaseText.includes(keyword)) {
        // Cek apakah kata kunci memiliki alternatif
        const keywordAlternative = keywordsAlternative.find(keywordAlternative => keywordAlternative.keyword === keyword)
        if (keywordAlternative) {
          // Cek apakah salah satu alternatif kata kunci ditemukan
          const isAlternativeFound = keywordAlternative.alternatives.some(alternative => lowercaseText.includes(alternative))
          if (!isAlternativeFound) {
            return false
          }
        } else {
          return false
        }
      }
    }

    // Jika semua kata kunci ditemukan, maka teks dianggap valid
    return true
  },

  // Helper: Fungsi untuk menangani perintah / command yang diterima
  __handleCommand: (bot, msg, command, args, user, chatId) => {
    const commandName = command.command
    const supportedCommands = require('../../databases/commands.json')

    if (commandName === '/presensi') {
      const jenis = args[0] // Mengambil argumen pertama
      const keterangan = args.slice(1).join(' ') // Menggabungkan argumen setelah jenis menjadi satu string

      // Lakukan sesuatu untuk mencatat presensi

      // Ambil Jenis yang didukung dari param.values
      const supportedJenis = command.params.find(param => param.name.toLowerCase() === 'jenis').values // ['hadir', 'izin', 'sakit', 'cuti', 'alpha']

      // Cek apakah jenis yang dimasukkan sesuai dengan yang didukung
      if (!supportedJenis.includes(jenis)) {
        bot.sendMessage(chatId, `Jenis presensi tidak valid. Jenis yang didukung: ${supportedJenis.join(', ')}`, {
          reply_to_message_id: msg.message_id
        })
        return
      }

      // Cek apakah keterangan tidak kosong jika jenis presensi adalah izin, sakit, atau cuti
      if (['izin', 'sakit', 'cuti'].includes(jenis) && !keterangan) {
        bot.sendMessage(chatId, `Keterangan tidak boleh kosong untuk jenis presensi: ${jenis}`, {
          reply_to_message_id: msg.message_id
        })
        return
      }

      // Cek apakah ada foto yang dikirimkan
      if (!msg.photo || !msg.photo?.length) {
        bot.sendMessage(chatId, 'Presensi membutuhkan foto.', {
          reply_to_message_id: msg.message_id
        })
        return
      }

      //   console.log('args', args)
      //   console.log('jenis', jenis)

      // Simpan data presensi ke dalam file CSV

      // Ambil status dari pesan dengan ucfirst
      const status = jenis.charAt(0).toUpperCase() + jenis.slice(1)

      // Ambil tanggal dan waktu dari pesan
      const dateObj = new Date(msg.date * 1000)
      const date = moment(dateObj).tz('Asia/Jakarta') // Menggunakan zona waktu Asia/Jakarta

      // Format tanggal dan waktu menjadi string
      const dateTimeString = date.format('YYYY-MM-DD HH:mm:ss')
      const dayName = date.format('dddd') // Nama hari dalam bahasa Indonesia

      //   const photUrl = `${baseURL}/${photoPath}`

      // Ambil username dari pesan
      const username = `@${msg.from.username}`

      // Ambil keterangan dari pesan
      const note = keterangan || ''

      // Ambil pesan utuh
      let messageRaw
      if (msg.text) {
        messageRaw = msg.text
      } else {
        messageRaw = msg.caption ? msg.caption : ''
      }

      // Ambil informasi dari msg untuk dimasukkan ke dalam file CSV
      //   const rowData = [msg.from.username, status, dateString, photUrl]
      const rowData = [username, status, note, dateTimeString, messageRaw]

      const dateFileName = date.format('YYYY-MM-DD') // format: YYYY-MM-DD
      saveToCSV([rowData], `datas/attendance-${dateFileName}.csv`)

      // Simpan ke dalam database/logs.json
      saveAttendanceToJSONFile(msg, {
        status,
        note
      })

      // Kirim pesan sukses

      const successMessageText = `<b>Sip!</b> Kehadiran berhasil dicatat.\n\n<code>Username: ${username}\nStatus: ${status}\nTimestamp: ${dayName}, ${dateTimeString} WIB</code>`

      // Kirim pesan sukses
      bot.sendMessage(chatId, successMessageText, {
        parse_mode: 'HTML',
        reply_to_message_id: msg.message_id
      })
    } else if (commandName === '/laporanpresensi') {
      const tahun = args[0]
      const bulan = args[1]
      // Lakukan sesuatu untuk menghasilkan laporan presensi berdasarkan tahun dan bulan
      // Contoh respons:
      bot.sendMessage(chatId, `Menampilkan laporan presensi untuk tahun ${tahun} bulan ${bulan}`, {
        reply_to_message_id: msg.message_id
      })
    } else {
      // bot.sendMessage(chatId, 'Perintah tidak dikenali.')
      bot.sendMessage(chatId, listSupportedCommandText(supportedCommands), {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: msg.message_id
      })
    }
  },

  listSupportedCommandText,
  invalidParamsText

}
