
const {
	default: makeWASocket,
   BufferJSON,
   useSingleFileAuthState,
   generateForwardMessageContent,
   prepareWAMessageMedia,
   generateWAMessageFromContent, 
   generateMessageID,
   downloadContentFromMessage,
	initInMemoryKeyStore,
	DisconnectReason,
	AnyMessageContent,
	delay
} = require("@adiwajshing/baileys-md")
const figlet = require("figlet");
const fs = require("fs");
const moment = require('moment')
const chalk = require('chalk')
const logg = require('pino')
const clui = require('clui')
const { Spinner } = clui
const { color, mylog, infolog } = require("./lib/color");
const time = moment(new Date()).format('HH:mm:ss DD/MM/YYYY')
let setting = JSON.parse(fs.readFileSync('./config.json'));
let session = `./${setting.sessionName}.json`
const { state, saveState } = useSingleFileAuthState(session)
const { smsg, getBuffer, fetchJson, fetchText, getRandom, getGroupAdmins, runtime, sleep } = require("./lib/myfunc");
let mono = '*'

function title() {
      console.clear()
	console.log(chalk.bold.green(figlet.textSync('WansBot|MultiDevice', {
		font: 'Standard',
		horizontalLayout: 'default',
		verticalLayout: 'default',
		width: 80,
		whitespaceBreak: false
	})))
	console.log(chalk.yellow(`\n                        ${chalk.yellow('[ Created By Wans ]')}\n\n${chalk.red('Wans Bot')} : ${chalk.white('WhatsApp Bot Multi Device')}\n${chalk.red('Follow Instagram')} : ${chalk.white('@norman_wawans')}\n${chalk.red('Message Me On WhatsApp')} : ${chalk.white('+62 815-2874-3676')}\n${chalk.red('Donate')} : ${chalk.white('085852353712 ( Gopay/dana/Pulsa )')}\n`))
}

/**
* Uncache if there is file change;
* @param {string} module Module name or path;
* @param {function} cb <optional> ;
*/
function nocache(module, cb = () => { }) {
	console.log(`Module ${module} sedang diperhatikan terhadap perubahan`) 
	fs.watchFile(require.resolve(module), async () => {
		await uncache(require.resolve(module))
		cb(module)
	})
}
/**
* Uncache a module
* @param {string} module Module name or path;
*/
function uncache(module = '.') {
	return new Promise((resolve, reject) => {
		try {
			delete require.cache[require.resolve(module)]
			resolve()
		} catch (e) {
			reject(e)
		}
	})
}

const status = new Spinner(chalk.cyan(` Booting WhatsApp Bot`))
const starting = new Spinner(chalk.cyan(` Preparing After Connect`))
const reconnect = new Spinner(chalk.redBright(` Reconnecting WhatsApp Bot`))

const connectToWhatsApp = async () => {
	const conn = makeWASocket({ printQRInTerminal: true, logger: logg({ level: 'silent' }), auth: state })
	title()
	
	/* Auto Update */
	require('./lib/color')
	require('./lib/myfunc')
	require('./message/msg')
	nocache('./lib/color', module => console.log(chalk.greenBright('[ WHATSAPP BOT ]  ') + time + chalk.cyanBright(` "${module}" Telah diupdate!`)))
	nocache('./lib/myfunc', module => console.log(chalk.greenBright('[ WHATSAPP BOT ]  ') + time + chalk.cyanBright(` "${module}" Telah diupdate!`)))
	nocache('./message/msg', module => console.log(chalk.greenBright('[ WHATSAPP BOT ]  ') + time + chalk.cyanBright(` "${module}" Telah diupdate!`)))
	
	conn.multi = true
	conn.nopref = false
	conn.prefa = 'anjing'
	/*conn.ev.on('messages.upsert', async m => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
        msg = chatUpdate.messages[0]
        if (!msg.message) return
        msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message
        if (msg.key && msg.key.remoteJid === 'status@broadcast') return
        if (msg.key.fromMe && chatUpdate.type === 'notify') return
        if (msg.key.id.startsWith('BAE5') && msg.key.id.length === 16) return
        require("./message/msg")(conn, msg, m, setting)
        } catch (err) {
            console.log(err)
        }
    })*/
  conn.ev.on('messages.upsert', async m => {
  	try {
		if (!m.messages) return;
		const msg = m.messages[0]
		m = smsg(conn, msg)
		require('./message/msg')(conn, msg, m, setting)
		} catch (err) {
            console.log(err)
        }
	})
	
	conn.ev.on('group-participants.update', async (anu) => {
        console.log(anu)
        try {
            let metadata = await conn.groupMetadata(anu.id)
            let participants = anu.participants
            for (let num of participants) {
                // Get Profile Picture User
                try {
                    ppuser = await conn.profilePictureUrl(num, 'image')
                } catch {
                    ppuser = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
                }

                // Get Profile Picture Group
                try {
                    ppgroup = await conn.profilePictureUrl(anu.id, 'image')
                } catch {
                    ppgroup = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
                }

                if (anu.action == 'add') {
                    conn.sendMessage(anu.id, { image: { url: ppuser }, contextInfo: { mentionedJid: [num] }, caption: `${mono}Welcome to ${metadata.subject} @${num.split("@")[0]}${mono}\n\n${mono}Jangan lupa baca deskripsi grup yaa${mono}` })
                } else if (anu.action == 'remove') {
                    conn.sendMessage(anu.id, { image: { url: ppuser }, contextInfo: { mentionedJid: [num] }, caption: `${mono}@${num.split("@")[0]} Keluar dari grup ${metadata.subject}${mono}` })
                }
            }
        } catch (err) {
            console.log(err)
        }
    })
    
    
	conn.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update
		if (connection === 'close') {
			status.stop()
			reconnect.stop()
			starting.stop()
			console.log(mylog('Server Ready ???'))
			lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut 
			? connectToWhatsApp()
			: console.log(mylog('Wa web terlogout...'))
		}
	})
	conn.ev.on('creds.update', () => saveState)
	return conn
}

connectToWhatsApp()
.catch(err => console.log(err))
