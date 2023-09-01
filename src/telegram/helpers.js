const fs = require('fs')
const https = require('https')

require('moment-timezone')
const moment = require('moment')

const headerTitles = ['Nama', 'Status', 'Pesan', 'Tanggal']

// Helper: teks yang akan dikirimkan jika format pesan tidak sesuai
// berisi daftar command dan parameter yang didukung serta penjelasan / description nya
const listSupportedCommandText = (supportedCommands) => {
  // output:
  // **Perintah tidak valid**.
  //
  // **Daftar Perintah:**
  // - `**/presensi** <jenis> <keterangan>` - Mencatat presensi
  // - `**/laporan-presensi** <tahun> <bulan>` - Menampilkan laporan presensi

  const text = `**Perintah tidak valid**.\n\n**Daftar Perintah:**\n${supportedCommands.map((command) => `- \`**${command.command}**\` ${command.description}`).join('\n')}`

  return text
}

// Helper: teks yang akan dikirimkan jika jumlah parameter tidak sesuai
// berisi daftar parameter yang didukung serta penjelasan / description nya
const invalidParamsText = (command) => {
  const commandName = command.command
  // output:
  // Perintah `/presensi` memerlukan lebih banyak parameter.
  // Gunakan `/presensi <jenis> <keterangan>`.
  //
  // Berikut adalah daftar parameter yang didukung:
  // - `<jenis>` : description
  // - `<keterangan>` : description

  const text = `Perintah \`/${commandName}\` memerlukan lebih banyak parameter.\nGunakan \`/${commandName} ${command.params.map((param) => `<${param.name}>`).join(' ')}\`.\n\nBerikut adalah daftar parameter yang didukung:\n${command.params.map((param) => `- \`<${param.name}>\` : ${param.description}`).join('\n')}`

  return text
}

module.exports = {

  saveToCSV: (data, fileName, folder = 'datas') => {
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
  },
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
  __handleCommand: (bot, command, args, user, chatId) => {
    const commandName = command.command
    const supportedCommands = require('../../databases/commands.json')

    switch (commandName) {
      case '/presensi':
        // const jenis = args[0]
        // const keterangan = args.slice(1).join(' ') // Menggabungkan argumen setelah jenis menjadi satu string
        // Lakukan sesuatu dengan perintah presensi, misalnya catat di database
        // Contoh respons:
        // bot.sendMessage(chatId, `Presensi berhasil dicatat: Jenis: ${jenis}, Keterangan: ${keterangan}`)
        break

      case '/laporan-presensi':
        // const tahun = args[0]
        // const bulan = args[1]
        // Lakukan sesuatu untuk menghasilkan laporan presensi berdasarkan tahun dan bulan
        // Contoh respons:
        // bot.sendMessage(chatId, `Menampilkan laporan presensi untuk tahun ${tahun} bulan ${bulan}`)
        break

      default:
        // bot.sendMessage(chatId, 'Perintah tidak dikenali.')
        bot.sendMessage(chatId, listSupportedCommandText(supportedCommands), {
          parse_mode: 'MarkdownV2'
        })
        break
    }
  },

  listSupportedCommandText,
  invalidParamsText

}
