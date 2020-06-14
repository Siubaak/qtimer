const app = getApp()
const today = require('../../../utils/today.js')
const { createRoom } = require('../../../utils/cloud.js')

const CREATE_INTERVAL_THRESHOLD = 2 * 60 * 1000 // 至少间隔2min才能再尝试创建另外一个房间

Page({
  data: {
    playerIndex: 0,
    supportedPlayers: [2, 3, 4, 5],

    typeIndex: 0,
    supportedTypes: ['3x3'],

    timeIndex: 1,
    supportedTimes: [3, 5, 12],

    lastCreateTs: 0
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
    const now = Date.now();
    if (now < this.data.lastCreateTs + CREATE_INTERVAL_THRESHOLD) {
      wx.showModal({
        title: '提示',
        content: '创建房间太频繁，过2分钟再试吧',
        confirmText: '我知道了',
        showCancel: false
      })
      return;
    }
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
        app.globalData.roomInfo = roomInfo
        this.createGroup(roomInfo)
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
    this.setData({
      lastCreateTs: now
    })
  },
  createGroup(roomInfo) {
    const { groups } = app.globalData
    const curGroup = {
      name: '比赛' + roomInfo.id,
      create: today(new Date(roomInfo.create)),
      type: roomInfo.type,
      details: []
    }
    groups.push(curGroup)
    app.globalData.current = groups.length - 1
    
    app.saveCurrent()
    app.saveGroups()
  }
})
