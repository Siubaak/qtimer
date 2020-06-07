const app = getApp()
const today = require('../../utils/today.js')
const { watchRoom, setScramble, setTime, updateTime } = require('../../utils/cloud.js')

let interval = null
let readyTimeout = null
let startTime = 0
let lastTap = 0
let allowModify = false

const WAIT_FOR_START_MSG = '请等待比赛开始'
const WAIT_FOR_OTHERS_MSG = '请等待其他对手完成'
const FINISH_AND_EXIT_MSG = '比赛结束，请退出比赛房间'

Page({
  data: {
    status: 0, // 0:完成 1:准备 2:计时中
    origin: 0,
    time: 0,
    scramble: '',
    timeClass: '',
    roomId: ''
  },
  onShow() {
    const { roomInfo } = app.globalData
    if (roomInfo.id) {
      this.setData({
        roomId: roomInfo.id
      })
      this.dataWatcher = watchRoom({
        change: () => {
          this.getScramble()
        }
      })
    } else {
      this.getScramble()
    }
  },
  onHide() {
    const { roomInfo } = app.globalData
    if (roomInfo.id) {
      this.dataWatcher.close()
    }
    if (this.data.status === 2) {
      this.finish()
    }
    this.preventModify()
  },
  onShareAppMessage() {
    if (this.data.time) {
      return {
        title: '看，我获得个好成绩，你也来试一下吧',
        path: '/pages/timer/index',
        success() {
          wx.showToast({ title: '分享成功' })
        }
      }
    }
    return {
      title: '我发现个很好用的计时器，你也来试一下吧',
      path: '/pages/timer/index'
    }
  },
  getScramble() {
    const { current, groups, roomInfo } = app.globalData
    if (roomInfo.id) { // 在比赛房间里
      if (roomInfo.status === 0) {
        this.setData({ scramble: WAIT_FOR_START_MSG })
      } else if (roomInfo.status === 2) {
        this.setData({ scramble: FINISH_AND_EXIT_MSG })
      } else {
        let hasAllFinished = true
        let selfSolvedNum = groups[current].details.length
        for (let i = 0; i < roomInfo.players.length; i++) {
          if (selfSolvedNum > roomInfo.players[i].details.length) {
            hasAllFinished = false
            break
          }
        }
        if (hasAllFinished) {
          this.setData({
            scramble: roomInfo.scrambles[selfSolvedNum]
          })
        } else if (roomInfo.scrambles.length > selfSolvedNum) {
          this.setData({
            scramble: WAIT_FOR_OTHERS_MSG
          })
        } else {
          app.getWorkerResult({
            type: groups[current].type
          }, ({ type, data }) => {
            if (type === groups[current].type) {
              setScramble({
                data: {
                  scramble: data
                }
              })
            }
          })
        }
      }
    } else {
      app.getWorkerResult({
        type: groups[current].type
      }, ({ type, data }) => {
        if (type === groups[current].type) {
          this.setData({ scramble: data })
        }
      })
    }
  },
  pressDown() {
    const { current, groups } = app.globalData
    if (this.data.status === 0) {
      if (allowModify && Date.now() - lastTap < 300) {
        const itemList = ['正常', '+2', 'DNF', '删除']
        if (roomInfo.id) {
          // 如果是比赛，不允许删除
          itemList.pop()
        }
        wx.showActionSheet({
          itemList: itemList,
          success: ({ tapIndex }) => {
            if (tapIndex < 3) {
              const time = this.modify(tapIndex)
              this.setData({ time })
    
              const details = groups[current].details
              details[details.length - 1].time = time
              details[details.length - 1].cond = tapIndex

              app.saveGroups()

              if (roomInfo.id) {
                updateTime({
                  data: {
                    time: time
                  }
                })
              }
            } else {
              wx.showModal({
                title: '删除成绩',
                content: '当前成绩将不纳入分组统计，确定删除当前成绩？',
                success: ({ confirm }) => {
                  if (confirm) {
                    this.setData({ time: 0 })
                    this.preventModify()
  
                    const { current, groups } = app.globalData
                    const details = groups[current].details
                    details.pop()

                    app.saveGroups()
                    app.notifyData()
                  }
                }
              })
            }
          }
        })
      } else if (
        [WAIT_FOR_START_MSG, WAIT_FOR_OTHERS_MSG, FINISH_AND_EXIT_MSG]
        .indexOf(this.data.scramble) === -1
      ) {
        // 如果不是比赛中需要等待的场景，允许开始
        this.ready()
      }
    } else if (this.data.status === 2) {
      this.finish()
    }
  },
  pressUp() {
    if (this.data.status === 1) {
      this.start()
    } else {
      clearTimeout(readyTimeout)
      this.setData({ timeClass: '' })
      lastTap = Date.now()
    }
  },
  ready() {
    this.setData({ timeClass: 'ready' })

    readyTimeout = setTimeout(() => {
      this.setData({ status: 1, timeClass: 'start' })
      this.preventModify()
      wx.vibrateShort()
    }, 500)
  },
  start() {
    startTime = Date.now()
    interval = setInterval(() => {
      const msTime = Date.now() - startTime
      if (msTime < 599990) {
        this.setData({ origin: msTime, time: msTime })
      } else {
        this.setData({ origin: msTime, time: 100000 })
        this.finish()
        this.preventModify()
      }
    }, 10)

    this.setData({
      status: 2,
      timeClass: ''
    })

    wx.setKeepScreenOn({ keepScreenOn: true })
    
    const { roomInfo } = app.globalData
    if (!roomInfo.id) {
      // 如果不是在比赛，开始计时就获取打乱
      this.getScramble()
    }
  },
  finish() {
    clearInterval(interval)

    wx.vibrateShort()
    wx.setKeepScreenOn({ keepScreenOn: false })
    
    const { origin, time, scramble } = this.data
    const { current, groups, roomInfo } = app.globalData
    const curGroup = groups[current]
    curGroup.details.push({
      origin,
      time,
      cond: 0,
      scramble, 
      create: today()
    })
    app.saveGroups()
  
    this.setData({ status: 0 })
    this.allowModify()
    app.notifyData()

    if (roomInfo.id) {
      setTime({
        data: {
          time: time
        }
      })
    }

    if (!wx.getStorageSync('__finish_tips')) {
      wx.setStorageSync('__finish_tips', 1)
      wx.showModal({
        title: '提示',
        content: '当左下角“计时”选项出现红点时，可以双击屏幕对成绩进行操作哦',
        confirmText: '我知道了',
        showCancel: false
      })
    }
  },
  modify(cond) {
    switch(cond) {
      case 1:
        return this.data.origin + 2000
      case 2:
        return 100000 // 100000为DNF，wxs传不进去Infinity
      default:
        return this.data.origin
    }
  },
  allowModify() {
    allowModify = true
    wx.showTabBarRedDot({ index: 0 })
  },
  preventModify() {
    wx.hideTabBarRedDot({ index: 0 })
    allowModify = false
  }
})
