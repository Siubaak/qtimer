const app = getApp()
const dayjs = require('dayjs')
const { generateScramble } = require('../../utils/patch.js')

let interval = null
let readyTimeout = null

Page({
  data: {
    status: 0, // 0:完成 1:准备 2:计时中
    time: '0.00',
    scramble: '',
    statusColor: ''
  },
  onLoad() {
    this.setData({
      scramble: generateScramble(app.globalData.type)
    })
  },
  pressDown() {
    if (this.data.status === 0) {
      this.ready()
    } else if (this.data.status === 2) {
      this.finish()
    }
  },
  pressUp() {
    if (this.data.status === 1) {
      this.start()
    } else {
      clearTimeout(readyTimeout)
    }
  },
  ready() {
    this.setData({
      statusColor: 'ready'
    })
    readyTimeout = setTimeout(() => this.setData({
      status: 1,
      statusColor: 'start'
    }), 500)
  },
  start() {
    console.log('start')
    this.setData({
      status: 2,
      statusColor: ''
    })
    this.startTimer()
    this.setData({
      scramble: generateScramble(app.globalData.type)
    })
  },
  finish() {
    console.log('end')
    this.stopTimer()
    this.setData({ status: 0 })
  },
  startTimer() {
    const now = Date.now()
    interval = setInterval(() => {
      this.setData({
        time: dayjs(Date.now() - now).format('m:s.SSS')
      })
    }, 10)
  },
  stopTimer() {
    clearInterval(interval)
  }
})
