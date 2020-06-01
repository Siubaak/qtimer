const app = getApp()
const today = require('../../../utils/today.js')

Page({
  data: {
    typeIndex: 0,
    supportedTypes: ['3x3'],

    timeIndex: 1,
    supportedTimes: [3, 5, 12]
  },
  onShow() {
    app.getWorkerResult({
      type: 'types'
    }, ({ type, data }) => {
      if (type === 'types') {
        this.setData({
          supportedTypes: data,
          typeIndex: data.indexOf('3x3')
        })
      }
    })
  },
  switchType(event) {
    this.setData({ typeIndex: event.detail.value })
  },
  switchTime(event) {
    this.setData({ timeIndex: event.detail.value })
  },
  createRoom(event) {
    const roomId = 711664
    app.globalData.room.id = roomId
    app.globalData.room.self = event.detail.userInfo
    this.createGroup(roomId)
    wx.redirectTo({
      url: `/pages/room/index`
    })
  },
  createGroup(id) {
    const { groups } = app.globalData
    const curGroup = {
      name: '比赛' + id,
      create: today(),
      type: this.data.supportedTypes[this.data.typeIndex],
      details: []
    }
    groups.push(curGroup)
    app.globalData.current = groups.length - 1
    
    app.saveCurrent()
    app.saveGroups()
  }
})
