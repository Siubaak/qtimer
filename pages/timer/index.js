const app = getApp()
const dayjs = require('dayjs')
const { generateScramble } = require('../../utils/patch.js')

let interval = null
let readyTimeout = null
let startTime = 0

Page({
  data: {
    status: 0, // 0:完成 1:准备 2:计时中
    time: '0.00',
    scramble: '',
    timeClass: '',
    scrambleClass: ''
  },
  onLoad() {
    this.setData({
      scramble: generateScramble(app.globalData.type)
    })
  },
  pressDown() {
    console.log('down')
    if (this.data.status === 0) {
      this.ready()
    } else if (this.data.status === 2) {
      this.finish()
    }
  },
  pressUp() {
    console.log('up')
    if (this.data.status === 1) {
      this.start()
    } else {
      clearTimeout(readyTimeout)
      this.setData({
        timeClass: ''
      })
    }
  },
  ready() {
    this.setData({
      timeClass: 'ready'
    })
    readyTimeout = setTimeout(() => this.setData({
      status: 1,
      timeClass: 'start'
    }), 500)
  },
  start() {
    this.setData({
      status: 2,
      timeClass: ''
    })
    this.startTimer()
    this.setData({
      scrambleClass: 'start',
      scramble: generateScramble(app.globalData.type)
    })
  },
  finish() {
    this.stopTimer()
    this.setData({
      status: 0,
      scrambleClass: ''
    })
  },
  startTimer() {
    startTime = Date.now()
    interval = setInterval(() => {
      const msTime = Date.now() - startTime
      const time = dayjs(msTime).format(msTime < 60000 ? 's.SSS' : 'm:ss.SSS')
      this.setData({
        time: time.substring(0, time.length - 1)
      })
    }, 10)
  },
  stopTimer() {
    clearInterval(interval)
  }
})
