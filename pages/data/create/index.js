const app = getApp()
const today = require('../../../utils/today.js')
const { createRoom } = require('../../../utils/cloud.js')

Page({
  data: {
    playerIndex: 0,
    supportedPlayers: [2],

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
  switchPlayers(event) {
    this.setData({ playerIndex: event.detail.value })
  },
  switchType(event) {
    this.setData({ typeIndex: event.detail.value })
  },
  switchTime(event) {
    this.setData({ timeIndex: event.detail.value })
  },
  createRoom(event) {
    wx.showLoading({ title: '正在创建房间', mask: true })
    const userInfo = event.detail.userInfo
    createRoom({
      data: {
        type: this.data.supportedTypes[this.data.typeIndex],
        solveNum: this.data.supportedTimes[this.data.timeIndex],
        playerNum: this.data.supportedPlayers[this.data.playerIndex],
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
          title: '创建房间失败',
          content: res.error,
          confirmText: '我知道了',
          showCancel: false
        })
      },
      complete: () => wx.hideLoading()
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
