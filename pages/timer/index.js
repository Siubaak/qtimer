const app = getApp()
const today = require('../../utils/today.js')

let interval = null
let readyTimeout = null
let startTime = 0
let lastTap = 0
let allowModify = false

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
    this.getScramble()
    this.setData({
      roomId: app.globalData.room.id || ''
    })
  },
  onHide() {
    if (this.data.status === 2) {
      this.finish()
    }
    this.preventModify()
  },
  getScramble() {
    const { current, groups } = app.globalData
    app.getWorkerResult({
      type: groups[current].type
    }, ({ type, data }) => {
      if (type === groups[current].type) {
        this.setData({ scramble: data })
      }
    })
  },
  pressDown(event) {
    if (this.data.status === 0) {
      if (allowModify && Date.now() - lastTap < 300) {
        wx.showActionSheet({
          itemList: ['正常', '+2', 'DNF', '删除'],
          success: ({ tapIndex }) => {
            if (tapIndex < 3) {
              const time = this.modify(tapIndex)
              this.setData({ time })
    
              const { current, groups } = app.globalData
              const details = groups[current].details
              details[details.length - 1].time = time
              details[details.length - 1].cond = tapIndex

              app.saveGroups()
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
      } else {
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
    
    this.getScramble()
  },
  finish() {
    clearInterval(interval)

    wx.vibrateShort()
    wx.setKeepScreenOn({ keepScreenOn: false })
    
    const { origin, time, scramble } = this.data
    const { current, groups } = app.globalData
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
