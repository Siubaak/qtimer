const app = getApp()
const today = require('../../../utils/today.js')
const { joinRoom } = require('../../../utils/cloud.js')

const JOIN_INTERVAL_THRESHOLD = 10 * 1000 // 至少间隔10s才能再尝试加入另外一个房间

Page({
  data: {
    roomId: '',
    lastJoinTs: 0
  },
  onLoad(query) {
    if (query.room) {
      this.setData({ roomId: query.room })
    }
  },
  inputNumber(event) {
    this.setData({ roomId: event.detail.value })
  },
  joinRoom(event) {
    if (!/^\d{6}$/.test(this.data.roomId)) {
      wx.showModal({
        title: '加入房间失败',
        content: '房间号为6位数字，请检查房间号是否输入正确',
        confirmText: '我知道了',
        showCancel: false
      })
      return
    }
    const now = Date.now();
    if (now < this.data.lastJoinTs + JOIN_INTERVAL_THRESHOLD) {
      wx.showModal({
        title: '提示',
        content: '加入房间太频繁，过10秒再试吧',
        confirmText: '我知道了',
        showCancel: false
      })
      return;
    }
    wx.showLoading({ title: '正在加入房间', mask: true })
    const userInfo = event.detail.userInfo
    joinRoom({
      data: {
        roomId: this.data.roomId,
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
          title: '加入房间失败',
          content: res.error,
          confirmText: '我知道了',
          showCancel: false
        })
      },
      complete: () => wx.hideLoading()
    })
    this.setData({
      lastJoinTs: now
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
