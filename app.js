const today = require('./utils/today.js')
const groups = wx.getStorageSync('__groups')
const current = wx.getStorageSync('__current_group_index')

App({
  globalData: {
    current: 0,
    groups: [{
      name: '',
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