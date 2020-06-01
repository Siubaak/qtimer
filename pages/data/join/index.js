const app = getApp()
const today = require('../../../utils/today.js')

Page({
  data: {
    roomId: ''
  },
  inputNumber(event) {
    this.setData({ roomId: event.detail.value })
  },
  joinRoom(event) {
    if (this.data.roomId) {
      const roomId = this.data.roomId;
      app.globalData.room.id = roomId;
      app.globalData.room.self = event.detail.userInfo
      this.createGroup(roomId)
      wx.redirectTo({
        url: `/pages/room/index`
      })
    }
  },
  createGroup(id) {
    const { groups } = app.globalData
    const curGroup = {
      name: '比赛' + id,
      create: today(),
      type: '3x3',
      details: []
    }
    groups.push(curGroup)
    app.globalData.current = groups.length - 1
    
    app.saveCurrent()
    app.saveGroups()
  }
})
