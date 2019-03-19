const { supportedTypes } = require('./utils/patch.js')
const saveType = wx.getStorageSync('__current_type')

App({
  onLaunch: function () {
    if (saveType && supportedTypes.indexOf(saveType)) {
      this.globalData.type = saveType
    } else {
      wx.setStorageSync('__current_type', '3x3')
    }
  },
  globalData: {
    type: '3x3'
  }
})