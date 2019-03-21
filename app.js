const today = require('./utils/today.js')

const current = wx.getStorageSync('__current_group_index')
const groups = wx.getStorageSync('__groups')

App({
  globalData: {
    current: 0,
    groups: [{
      create: today(),
      type: '3x3',
      details: []
    }]
  },
  
  onLaunch: function () {
    if (groups) {
      this.globalData.groups = groups
      this.globalData.current = current
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