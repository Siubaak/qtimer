const app = getApp()

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
      create: Date.now(),
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
        complete: () => opt.complete && opt.complete()
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
          opt.complete && opt.complete()
        }
      })
  }

  generate()
}

function joinRoom(opt) {
  wx.cloud.callFunction({
    name: 'room',
    data: {
      action: 'join',
      params: opt.data
    },
    success(res) {
      if (res.errMsg.indexOf(':ok') === -1) {
        opt.fail && opt.fail({
          ret: 1000,
          error: '加入房间失败，请稍后再试'
        })
        return
      }

      if (res.result.ret) {
        opt.fail && opt.fail(res.result)
        return
      }

      opt.success & opt.success(res.result)
    },
    fail() {
      opt.fail && opt.fail({
        ret: 1000,
        error: '加入房间失败，请稍后再试'
      })
    },
    complete: () => opt.complete && opt.complete()
  })
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
      complete: () => opt.complete && opt.complete()
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
      complete: () => opt.complete && opt.complete()
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
      complete: () => opt.complete && opt.complete()
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

const checkIfEnd = (opt) => {
  wx.cloud.callFunction({
    name: 'room',
    data: {
      action: 'join',
      params: opt.data
    },
    success(res) {
      if (res.errMsg.indexOf(':ok') === -1) {
        opt.fail && opt.fail({
          ret: 1000,
          error: '更新房间状态失败，请稍后再试'
        })
        return
      }

      if (res.result.ret) {
        opt.fail && opt.fail(res.result)
        return
      }

      opt.success & opt.success(res.result)
    },
    fail() {
      opt.fail && opt.fail({
        ret: 1000,
        error: '更新房间状态失败，请稍后再试'
      })
    },
    complete: () => opt.complete && opt.complete()
  })
}

function setTime(opt) {
  const { roomInfo } = app.globalData
  const roomId = roomInfo.id
  if (!roomId) {
    opt.fail && opt.fail({
      ret: 1001,
      error: '房间不存在，无法提交成绩'
    })
    return
  }
  const selfSolvedNum = roomInfo.players[roomInfo.selfIndex].details.length
  if (selfSolvedNum >= roomInfo.solveNum) {
    return
  }
  // 需要判断是否结束游戏，决定是否需要更新房间状态
  const needCheckIfEnd = roomInfo.solveNum <= selfSolvedNum + 1
  db.collection('room')
    .where({
      id: roomInfo.id
    })
    .update({
      data: {
        [`players.${roomInfo.selfIndex}.details`]: _.push([opt.data.time]),
        msgList: _.push([{
          playerIndex: roomInfo.selfIndex,
          content: `完成第${selfSolvedNum + 1}次还原，成绩：${formatTime(opt.data.time)}`,
          system: true
        }])
      },
      success() {
        if (needCheckIfEnd) {
          checkIfEnd({
            data: {
              roomId: roomInfo.id
            },
            success: opt.success,
            fail: opt.fail,
            complete: opt.complete
          })
        } else {
          opt.success & opt.success({
            ret: 0
          })
        }
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
    opt.fail && opt.fail({
      ret: 1001,
      error: '房间不存在，无法更新成绩'
    })
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
      complete: () => opt.complete && opt.complete()
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