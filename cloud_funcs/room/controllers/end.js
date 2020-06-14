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
      error: '更新房间状态失败，请稍后再试'
    }
  }
  
  if (roomInfo.data.length < 1) {
    return {
      ret: 1004,
      error: '房间不存在，无法更新房间状态'
    }
  }

  const data = roomInfo.data[0]

  // 判断是否结束游戏，决定是否需要更新房间状态
  let isEnd = true
  for (let i = 0; i < data.players.length; i++) {
    if (data.solveNum > data.players[i].details.length) {
      // 如果有人没有完成
      isEnd = false
      break
    }
  }

  if (isEnd) {
    const upRes = await db.collection('room')
      .doc(data._id)
      .update({
        data: {
          status: 2,
          msgList: _.push([{
            content: '比赛结束，可点击右下角按钮查看结果，或点击左下角按钮退出游戏',
            system: true
          }])
        }
      })

    if (upRes.errMsg.indexOf(':ok') === -1) {
      return {
        ret: 1000,
        error: '更新房间状态失败，请稍后再试'
      }
    }
  }

  return {
    ret: 0
  }
}