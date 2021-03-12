const today = require('utils/today.js')
const patch = require('utils/patch.js')
const groups = wx.getStorageSync('__groups')
const current = wx.getStorageSync('__current_group_index')
const worker = wx.createWorker('workers/hotload.js')

patch(worker)

App({
  globalData: {
    current: 0,
    groups: [{
      name: '',
      create: today(),
      type: '3x3',
      details: []
    }],
    roomInfo: {}
  },
  getWorkerResult(req, done) {
    worker.postMessage(req)
    worker.onMessage(done)
  },
  onLaunch() {
    if (groups) {
      this.globalData.groups = groups
      if (!groups[current].roomId) {
        this.globalData.current = current
      } else {
        for (let i = groups.length - 1; i > -1; i--) {
          if (!groups[i].roomId) {
            this.globalData.current = i
            break
          }
        }
      }
    }
    this.saveCurrent()
    this.saveGroups()
  },
  saveCurrent() {
    wx.setStorageSync('__current_group_index', this.globalData.current)
  },
  saveGroups() {
    wx.setStorageSync('__groups', this.globalData.groups)
  }
})