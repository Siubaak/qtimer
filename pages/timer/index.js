const app = getApp()
const dayjs = require('dayjs')
const { generateScramble } = require('../../utils/patch.js')

let interval = null
let readyTimeout = null
let startTime = 0
let lastTap = 0

function format(msTime) {
  const time = dayjs(msTime).format(msTime < 60000 ? 's.SSS' : 'm:ss.SSS')
  return time.substring(0, time.length - 1)
}

Page({
  data: {
    status: 0, // 0:完成 1:准备 2:计时中
    origin: 0,
    time: '0.00',
    scramble: '',
    timeClass: '',
    timeSize: '',
    scrambleClass: ''
  },
  onLoad() {
    this.setData({
      scramble: generateScramble(app.globalData.type)
    })
  },
  pressDown() {
    if (this.data.status === 0) {
      if (Date.now() - lastTap < 300) {
        wx.showActionSheet({
          itemList: ['正常', '+2', 'DNF'],
          success: res => {
            console.log(res.tapIndex)
            switch(res.tapIndex) {
              case 0:
                this.setData({
                  time: format(this.data.origin)
                })
                break
              case 1:
                this.setData({
                  time: format(this.data.origin + 2000)
                })
                break
              case 2:
                this.setData({
                  time: 'DNF'
                })
                break
              default:
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
      this.setData({
        timeClass: ''
      })
      lastTap = Date.now()
    }
  },
  ready() {
    this.setData({
      timeClass: 'ready'
    })
    readyTimeout = setTimeout(() => {
      this.setData({
        status: 1,
        timeClass: 'start'
      })
      wx.vibrateShort()
    }, 800)
  },
  start() {
    startTime = Date.now()
    interval = setInterval(() => {
      const msTime = Date.now() - startTime
      this.setData({
        origin: msTime,
        time: format(msTime),
        timeSize: msTime < 60000 ? '' : 'small'
      })
      if (msTime > 599989) this.finish()
    }, 10)
    this.setData({
      status: 2,
      timeClass: 'timing',
      scrambleClass: 'hide',
      scramble: generateScramble(app.globalData.type)
    })
    wx.setKeepScreenOn({ keepScreenOn: true })
  },
  finish() {
    clearInterval(interval)
    this.setData({
      status: 0,
      scrambleClass: ''
    })
    wx.setKeepScreenOn({ keepScreenOn: false })
  }
})
