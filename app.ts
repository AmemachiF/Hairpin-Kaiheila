process.env.HTTP_PROXY=''
process.env.HTTPS_PROXY=''

import * as dotenv from 'dotenv'
dotenv.config()

var pjson = require('./package.json');

import { KaiheilaBot as Bot, MessageType, TextMessage } from 'kaiheila-bot-root'

const guildId = '2753609088608169'
const developChannel = '2937081174021544'
const mainChannel = '4509390765656763'

const sunRoleId = 157665
const settingSunRoleId = 160445

const yirenUserId = '3929712312'

var bot = new Bot({
  mode: 'websocket',
  token: process.env.TOKEN,
  ignoreDecryptError: false
})

// bot.messageSource.on('message', (e: any) => {
//   console.log(e)
// })

async function isSunRaised(): Promise<{ result: boolean, isRevoke: boolean }> {
  const users = await bot.API.guild.userList(guildId);
  const yiren = users.items.find(p => p.id === yirenUserId);
  const isSunRaiseRole = !!yiren.roles?.find(p_1 => p_1 === sunRoleId)
  const isSunSetRole = !!yiren.roles?.find(p_1 => p_1 === settingSunRoleId)
  if (yiren) {
    return { result: isSunRaiseRole, isRevoke: isSunRaiseRole || isSunSetRole  }
  } else {
    return { result: false, isRevoke: false };
  }
}

function sunRaise(isRevoke: boolean, channelId: string, callback: () => void) {
  bot.API.guildRole.grant(guildId, yirenUserId, sunRoleId).then((_) => {
    if (isRevoke) {
      bot.API.guildRole.revoke(guildId, yirenUserId, settingSunRoleId)
    }
    bot.API.message.create(MessageType.text, channelId, '太阳升起了').then((_) => {
      callback()
    })
  })
}

function sunSet(isRevoke: boolean, channelId: string, callback: () => void) {
  bot.API.guildRole.grant(guildId, yirenUserId, settingSunRoleId).then((_) => {
    if (isRevoke) {
      bot.API.guildRole.revoke(guildId, yirenUserId, sunRoleId)
    }
    bot.API.message.create(MessageType.text, channelId, '太阳落山了').then((_) => {
      callback()
    })
  })
}

setInterval(function() {
  const hour = new Date().getUTCHours();
  const dayOffset = (hour + 8 - 7) % 24
  isSunRaised().then((res) => {
    if (res.result && dayOffset < 12 || !res.result && dayOffset >= 12) {
      return
    }

    if (res.result) {
      sunSet(res.isRevoke, mainChannel, () => {
      })
    } else {
      sunRaise(res.isRevoke, mainChannel, () => {
      })
    }
  })
}, 10000)

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

      isSunRaised().then(res => {
        if (res.result) {
          sunSet(res.isRevoke, e.channelId, () => {
            bot.API.message.delete(e.msgId)
          })
        } else {
          sunRaise(res.isRevoke, e.channelId, () => {
            bot.API.message.delete(e.msgId)
          })
        }
      })

      // bot.API.guild.userList(guildId).then((users) => {
      //   const yiren = users.items.find(p => p.id === yirenUserId)
      //   if (yiren) {
      //     if (yiren.roles?.find(p => p === sunRoleId)) {
      //       bot.API.guildRole.grant(guildId, yirenUserId, settingSunRoleId).then((_) => {
      //         bot.API.guildRole.revoke(guildId, yirenUserId, sunRoleId).then((_) => {
      //           bot.API.message.create(MessageType.text, e.channelId, '太阳落山了').then((_) => {
      //             bot.API.message.delete(e.msgId)
      //           })
      //         })
      //       })
      //     } else if (yiren.roles?.find(p => p === settingSunRoleId)) {
      //       bot.API.guildRole.grant(guildId, yirenUserId, sunRoleId).then((_) => {
      //         bot.API.guildRole.revoke(guildId, yirenUserId, settingSunRoleId).then((_) => {
      //           bot.API.message.create(MessageType.text, e.channelId, '太阳升起了').then((_) => {
      //             bot.API.message.delete(e.msgId)
      //           })
      //         })
      //       })
      //     } else {
      //       bot.API.guildRole.grant(guildId, yirenUserId, sunRoleId).then((_) => {
      //         bot.API.message.create(MessageType.text, e.channelId, '太阳升起了').then((_) => {
      //           bot.API.message.delete(e.msgId)
      //         })
      //       })
      //     }
      //   }
      // })
      break
  }
  
})

bot.connect()
