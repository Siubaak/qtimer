const cloud = require('wx-server-sdk')

const db = cloud.database()
const _ = db.command

module.exports = async (params) => {
  const roomInfo = await db.collection('room')
    .where({
      id: params.roomId
    })
    .get()
  
  if (roomInfo.errMsg.indexOf(':ok') === -1) {
    return {
      ret: 1000,
      error: '加入房间失败，请稍后再试'
    }
  }
  
  if (roomInfo.data.length < 1) {
    return {
      ret: 1004,
      error: '房间不存在，请检查房间号是否输入正确'
    }
  }

  let exit = false
  const data = roomInfo.data[0]
  for (let i = 0; i < data.players.length; i++) {
    if (
      data.players[i].nickName === params.nickName &&
      data.players[i].avatarUrl === params.avatarUrl
    ) {
      exit = true
      break
    }
  }

  if (exit) {
    return {
      ret: 1003,
      error: '已退出比赛，无法重新加入'
    }
  }

  if (data.status) {
    return {
      ret: 1002,
      error: '房间已开始比赛，无法加入'
    }
  }

  if (data.playerNum <= data.players.length) {
    return {
      ret: 1001,
      error: '房间已满，无法加入'
    }
  }

  const isFull = data.playerNum === data.players.length + 1

  const joinRes = await db.collection('room')
    .doc(data._id)
    .update({
      data: {
        status: isFull ? 1 : 0,
        players: _.push([{
          nickName: params.nickName,
          avatarUrl: params.avatarUrl,
          details: []
        }]),
        msgList: _.push([{
          playerIndex: data.players.length,
          content: `加入了房间${isFull ? '，房间已满，开始比赛' : ''}`,
          system: true
        }])
      }
    })
  
  if (joinRes.errMsg.indexOf(':ok') === -1) {
    return {
      ret: 1000,
      error: '加入房间失败，请稍后再试'
    }
  }

  data.selfIndex = data.players.length

  return {
    ret: 0,
    roomInfo: data
  }
}