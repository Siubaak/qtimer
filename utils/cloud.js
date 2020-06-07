const app = getApp();
const today = require('../utils/today.js')

let loaded = false

if (!loaded) {
  wx.cloud.init({ env: 'qtimer' })
  loaded = true
}

const db = wx.cloud.database()
const _ = db.command

function createRoom(opt) {
  let id

  const getFirstScramble = (type, done) => {
    app.getWorkerResult({
      type: type
    }, ({ data }) => {
      done(data)
    })
  }

  const create = (firstScramble) => {
    const roomInfo = {
      id: id,
      status: 0, // 0:准备中; 1:比赛中; 2:比赛结束
      create: today(),
      type: opt.data.type,
      solveNum: opt.data.solveNum,
      playerNum: opt.data.playerNum,
      players: [{
        nickName: opt.data.nickName,
        avatarUrl: opt.data.avatarUrl,
        details: []
      }],
      scrambles: [firstScramble],
      msgList: [{
        playerIndex: 0,
        content: `创建了房间：${id}，快点击右上角∙∙∙转发邀请对手吧`,
        system: true
      }]
    }
    db.collection('room')
      .add({
        data: roomInfo,
        success() {
          roomInfo.selfIndex = 0
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
            getFirstScramble(opt.data.type, create)
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
    const isFull = data.playerNum === data.players.length + 1
    db.collection('room')
      .doc(data._id)
      .update({
        data: {
          status: isFull ? 1 : 0,
          players: _.push([{
            nickName: opt.data.nickName,
            avatarUrl: opt.data.avatarUrl,
            details: []
          }]),
          msgList: _.push([{
            playerIndex: data.players.length,
            content: `加入了房间${isFull ? '，房间已满，开始比赛' : ''}`,
            system: true
          }])
        },
        success() {
          data.selfIndex = data.players.length
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
            if (data.status) {
              opt.fail & opt.fail({
                ret: 1001,
                error: '房间已开始比赛，无法加入'
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
              error: '房间不存在，请检查房间号是否输入正确'
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
        const newRoomInfo = snapshot.docs[0]
        opt.change && opt.change(newRoomInfo)
      },
      onError(err) {
        opt.error && opt.error(err)
      }
    })
}

function sendReply(opt) {
  const { roomInfo } = app.globalData
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
        msgList: _.push([{
          playerIndex: roomInfo.selfIndex,
          content: opt.data.content
        }])
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

function quitRoom(opt) {
  const { roomInfo } = app.globalData
  const roomId = roomInfo.id
  if (!roomId) {
    return
  }
  const data = {
    msgList: _.push([{
      playerIndex: roomInfo.selfIndex,
      content: '退出了房间',
      system: true
    }])
  }
  const details = roomInfo.players[roomInfo.selfIndex].details
  const dnsNum =  roomInfo.solveNum - details.length
  if (dnsNum > 0) {
    data[`players.${roomInfo.selfIndex}.details`] = _.push(new Array(dnsNum).fill(100001))
  }
  db.collection('room')
    .where({
      id: roomInfo.id
    })
    .update({
      data: data,
      success() {
        opt.success & opt.success({
          ret: 0
        })
      },
      fail() {
        opt.fail && opt.fail({
          ret: 1000,
          error: '退出房间失败'
        })
      },
      complete: () => opt.complete()
    })
}

function setScramble(opt) {
  const { roomInfo } = app.globalData
  const roomId = roomInfo.id
  if (!roomId) {
    return
  }
  db.collection('room')
    .where({
      id: roomInfo.id
    })
    .update({
      data: {
        scrambles: _.set(roomInfo.scrambles.concat(opt.data.scramble))
      },
      success() {
        opt.success & opt.success({
          ret: 0,
          scramble: opt.data.scramble
        })
      },
      fail() {
        opt.fail && opt.fail({
          ret: 1000,
          error: '更新打乱失败，请稍后再试'
        })
      },
      complete: () => opt.complete()
    })
}

const fill = (num) => {
  const str = '0' + num
  return str.substring(str.length - 2)
}

const formatTime = (msTime) => {
  // 100000为DNF，100001为DNF，对齐./format.wxs
  if (msTime === 100000) {
    return 'DNF'
  } else if (msTime === 100001) {
    return 'DNS'
  } else {
    const ms = parseInt(msTime % 1000 / 10)
    msTime = parseInt(msTime / 1000)
    const s = msTime % 60
    const m = parseInt(msTime / 60)
    if (m) {
      return m + ':' + fill(s) + '.' + fill(ms)
    } else {
      return s + '.' + fill(ms)
    }
  }
}

function setTime(opt) {
  const { roomInfo } = app.globalData
  const roomId = roomInfo.id
  if (!roomId) {
    return
  }
  const selfSolvedNum = roomInfo.players[roomInfo.selfIndex].details.length
  if (selfSolvedNum >= roomInfo.solveNum) {
    return
  }
  // 判断是否结束游戏，决定是否需要更新房间状态
  let hasFinished = true
  for (let i = 0; i < roomInfo.players.length; i++) {
    if (roomInfo.selfIndex === i) {
      if (roomInfo.solveNum > selfSolvedNum + 1) {
        // 如果是自己没有完成
        hasFinished = false
        break
      }
    } else if (roomInfo.solveNum > roomInfo.players[i].details.length) {
      // 或者是其他人没有完成
      hasFinished = false
      break
    }
  }
  const data = {
    [`players.${roomInfo.selfIndex}.details`]: _.push([opt.data.time])
  }
  const msgList = [{
    playerIndex: roomInfo.selfIndex,
    content: `完成第${selfSolvedNum + 1}次还原，成绩：${formatTime(opt.data.time)}`,
    system: true
  }]
  if (hasFinished) {
    data.status = 2
    msgList.push({
      content: '比赛结束，可点击右下角按钮查看结果，或点击左下角按钮退出游戏',
      system: true
    })
  }
  data.msgList = _.push(msgList)
  db.collection('room')
    .where({
      id: roomInfo.id
    })
    .update({
      data: data,
      success() {
        opt.success & opt.success({
          ret: 0
        })
      },
      fail() {
        opt.fail && opt.fail({
          ret: 1000,
          error: '更新成绩失败，请稍后再试'
        })
      },
      complete: () => opt.complete()
    })
}

function updateTime(opt) {
  const { roomInfo } = app.globalData
  const roomId = roomInfo.id
  if (!roomId) {
    return
  }
  const selfSolvedNum = roomInfo.players[roomInfo.selfIndex].details.length
  if (selfSolvedNum > roomInfo.solveNum) {
    return
  }
  db.collection('room')
    .where({
      id: roomInfo.id
    })
    .update({
      data: {
        [`players.${roomInfo.selfIndex}.details.${selfSolvedNum - 1}`]: opt.data.time,
        msgList: _.push([{
          playerIndex: roomInfo.selfIndex,
          content: `更改第${selfSolvedNum}次成绩：${formatTime(opt.data.time)}`,
          system: true
        }])
      },
      success() {
        opt.success & opt.success({
          ret: 0
        })
      },
      fail() {
        opt.fail && opt.fail({
          ret: 1000,
          error: '更新成绩失败，请稍后再试'
        })
      },
      complete: () => opt.complete()
    })
}

module.exports = {
  createRoom: createRoom,
  joinRoom: joinRoom,
  watchRoom: watchRoom,
  sendReply: sendReply,
  quitRoom: quitRoom,
  setScramble: setScramble,
  setTime: setTime,
  updateTime: updateTime
}