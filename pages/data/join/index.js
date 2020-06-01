const app = getApp()
const today = require('../../../utils/today.js')
const { joinRoom } = require('../../../utils/cloud.js')

Page({
  data: {
    roomId: ''
  },
  inputNumber(event) {
    this.setData({ roomId: event.detail.value })
  },
  joinRoom(event) {
    if (this.data.roomId) {
      wx.showLoading({ title: '正在加入房间', mask: true })
      const userInfo = event.detail.userInfo
      joinRoom({
        data: {
          roomId: this.data.roomId,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        },
        success: ({ roomInfo }) => {
          app.globalData.room.id = roomInfo.id
          app.globalData.room.self = userInfo
          this.createGroup(roomInfo.id)
          wx.redirectTo({
            url: `/pages/room/index`
          })
        },
        fail: (res) => {
          wx.showModal({
            title: '加入房间失败',
            content: res.error,
            confirmText: '我知道了',
            showCancel: false
          })
        },
        complete: () => wx.hideLoading()
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
