const app = getApp()

Page({
  data: {
    group: {}
  },
  onShow() {
    const { current, groups } = app.globalData
    const curGroup = groups[current]

    this.setData({ group: curGroup })
  },
  navBack() {
    wx.navigateBack({ delta: 1 })
  }
})
