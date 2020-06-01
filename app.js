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
    room: {}
  },
  getWorkerResult(req, done) {
    worker.postMessage(req)
    worker.onMessage(done)
  },
  onLaunch() {
    if (groups) {
      this.globalData.groups = groups
      this.globalData.current = current
    }
    this.saveCurrent()
    this.saveGroups()
    this.notifyData()
  },
  saveCurrent() {
    wx.setStorageSync('__current_group_index', this.globalData.current)
  },
  saveGroups() {
    wx.setStorageSync('__groups', this.globalData.groups)
  },
  notifyData() {
    const { groups, current } = this.globalData
    const detailsLen = groups[current].details.length
    if ([5, 12, 50, 100].indexOf(detailsLen) !== -1) {
      wx.setTabBarBadge({ index: 1, text: '' + detailsLen })
    } else {
      wx.removeTabBarBadge({ index: 1 })
    }
  }
})