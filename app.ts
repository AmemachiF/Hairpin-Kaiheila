process.env.HTTP_PROXY=''
process.env.HTTPS_PROXY=''

import * as dotenv from 'dotenv'
dotenv.config()

var pjson = require('./package.json');

import { KaiheilaBot as Bot, MessageType, TextMessage } from 'kaiheila-bot-root'

const guildId = '2753609088608169'
const developChannel = '2937081174021544'

var bot = new Bot({
  mode: 'websocket',
  token: process.env.TOKEN,
  ignoreDecryptError: false
})

// bot.messageSource.on('message', (e: any) => {
//   console.log(e)
// })

bot.on('textMessage', (e: TextMessage) => {
  console.log(e)
  if (e.author.bot) { return }

  if (e.channelId === developChannel) {
    switch (e.content) {
      case '.my_info':
        bot.API.message.create(MessageType.kMarkdown, e.channelId,
          `nickname: ${e.author.nickname}\nauthorId: ${e.authorId}\nroleIds: ${e.author.roles.join(', ')}`, e.msgId)
          .then((msg) => {
            bot.API.message.delete(e.msgId)
          })
        break
      case '.roles':
        bot.API.guildRole.index(guildId).then((roles) => {
          const r = roles.map(p => `${p.name}(${p.roleId})`)
          bot.API.message.create(MessageType.text, e.channelId, r.join('\n'), e.msgId)
        })
      default:
        break
    }
  } 
  
  switch (e.content) {
    case '.help':
      bot.API.message.create(MessageType.kMarkdown, e.channelId,
`\`.help\`: 帮助
\`.ping\`: PING
\`.toggle_sun\`: 切换太阳`
      ).then((msg) => {
        bot.API.message.delete(e.msgId)
      })
      break
    case '.version':
      bot.API.message.create(MessageType.text, e.channelId, pjson.version, e.msgId)
      break
    case '.ping':
      const msgId = e.msgId
      bot.API.message.create(MessageType.text, e.channelId, 'PONG').then((msg) => {
        bot.API.message.update(msg.msgId, `PONG  - ${msg.msgTimestamp - e.msgTimestamp}ms`)
      })
      break
    case '.toggle_sun':
      if (157627 !in e.author.roles) { return }
      bot.API.guildRole.index(guildId).then((roles) => {
        const sunRole = roles.find((p) => p.roleId === 157665)
        if (sunRole) {
          sunRole.hoist = sunRole.hoist === 0 ? 1 : 0
        }
        bot.post('v3/guild-role/update', {
          guild_id: guildId,
          name: sunRole.name,
          color: sunRole.color,
          role_id: sunRole.roleId,
          hoist: sunRole.hoist,
          mentionable: sunRole.mentionable,
          permissions: sunRole.permissions,
        })
        bot.API.message.create(MessageType.text, e.channelId, sunRole.hoist === 0 ? '太阳落山了' : '太阳升起了').then((msg) => {
          bot.API.message.delete(e.msgId)
        })
      })
      break
  }
  
})

bot.connect()
