const app = getApp();

let loaded = false

if (!loaded) {
  wx.cloud.init({ env: 'qtimer' })
  loaded = true
}

const db = wx.cloud.database()
const _ = db.command

function createRoom(opt) {
  let id

  const create = () => {
    const roomInfo = {
      id: id,
      status: 0, // 0:准备中; 1:比赛开始; 2:比赛暂停; 3:比赛结束
      type: opt.data.type,
      solveNum: opt.data.solveNum,
      playerNum: opt.data.playerNum,
      players: [{
        nickName: opt.data.nickName,
        avatarUrl: opt.data.avatarUrl,
        details: []
      }],
      scrambles: [],
      msgList: []
    }
    db.collection('room')
      .add({
        data: roomInfo,
        success() {
          opt.success && opt.success({
            ret: 0,
            roomInfo: roomInfo
          })
        },
        fail() {
          opt.fail && opt.fail({
            ret: 1000,
            error: '生成房间号失败，请稍后再试'
          })
        },
        complete: () => opt.complete()
      })
  }

  let retryTimes = 5;
  const generate = () => {
    id = ('00000' + parseInt(Math.random() * 999999 + 1)).substr(-6)
    db.collection('room')
      .where({
        id: id
      })
      .get({
        success(res) {
          if (res.data.length) {
            if (retryTimes > 0) {
              retryTimes--
              generate()
            } else {
              opt.fail && opt.fail({
                ret: 1001,
                error: '房间数量已满，请稍后再试'
              })
            }
          } else {
            create()
          }
        },
        fail() {
          opt.fail && opt.fail({
            ret: 1000,
            error: '生成房间号失败，请稍后再试'
          })
        },
        complete: () => opt.complete()
      })
  }

  generate()
}

function joinRoom(opt) {
  const join = (data) => {
    db.collection('room')
      .doc(data._id)
      .update({
        data: {
          players: _.push({
            nickName: opt.data.nickName,
            avatarUrl: opt.data.avatarUrl,
            details: []
          })
        },
        success() {
          opt.success & opt.success({
            ret: 0,
            roomInfo: data
          })
        },
        fail() {
          opt.fail && opt.fail({
            ret: 1000,
            error: '加入房间失败，请稍后再试'
          })
        },
        complete: () => opt.complete()
      })
  }

  const find = () => {
    db.collection('room')
      .where({
        id: opt.data.roomId
      })
      .get({
        success(res) {
          if (res.data.length) {
            let exit = false
            const data = res.data[0]
            for (let i = 0; i < data.players.length; i++) {
              if (
                data.players[i].nickName === opt.data.nickName &&
                data.players[i].avatarUrl === opt.data.avatarUrl
              ) {
                exit = true
                break
              }
            }
            if (exit) {
              opt.fail & opt.fail({
                ret: 1002,
                error: '已退出比赛，无法重新加入'
              })
              return
            }
            if (data.playerNum <= data.players.length) {
              opt.fail & opt.fail({
                ret: 1001,
                error: '房间已满，无法加入'
              })
              return
            }
            join(res.data[0])
          } else {
            opt.fail & opt.fail({
              ret: 1003,
              error: '房间不存在，请确认房间号'
            })
          }
        },
        fail() {
          opt.fail && opt.fail({
            ret: 1000,
            error: '加入房间失败，请稍后再试'
          })
        },
        complete: () => opt.complete()
      })
  }

  find();
}

function watchRoom(opt) {
  const roomId = app.globalData.roomInfo.id
  if (!roomId) {
    opt.error && opt.error()
    return
  }
  return db.collection('room')
    .where({
      id: app.globalData.roomInfo.id
    })
    .watch({
      onChange(snapshot) {
        const roomInfo = snapshot.docs[0]
        opt.change && opt.change(roomInfo)
      },
      onError(err) {
        opt.error && opt.error(err)
      }
    })
}

function sendReply(opt) {
  const roomInfo = app.globalData.roomInfo
  const roomId = roomInfo.id
  if (!roomId) {
    opt.fail && opt.fail({
      ret: 1001,
      error: '房间不存在，无法回复'
    })
    return
  }
  db.collection('room')
    .where({
      id: roomInfo.id
    })
    .update({
      data: {
        msgList: _.push({
          playerIndex: roomInfo.selfIndex,
          content: opt.data.content
        })
      },
      success() {
        opt.success & opt.success({
          ret: 0
        })
      },
      fail() {
        opt.fail && opt.fail({
          ret: 1000,
          error: '回复失败，请稍后再试'
        })
      },
      complete: () => opt.complete()
    })
}

module.exports = {
  createRoom: createRoom,
  joinRoom: joinRoom,
  watchRoom: watchRoom,
  sendReply: sendReply
}