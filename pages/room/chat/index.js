const app = getApp();
const today = require('../../../utils/today.js')
const { watchRoom, sendReply, quitRoom } = require('../../../utils/cloud.js')

const REPLY_INTERVAL_THRESHOLD = 5 * 1000 // 至少间隔5s才能发送一条消息

let roomInfoWatcher = null

Page({
  data: {
    roomId: '',
    replyContent: '',
    selfIndex: '',
    players: [],
    msgList: [],
    result: false,
    finished: false
  },
  onLoad(query) {
    const { roomInfo } = app.globalData
    this.setData({
      roomId: roomInfo.id,
      msgList: roomInfo.msgList,
      players: roomInfo.players,
      selfIndex: roomInfo.selfIndex,
      finished: roomInfo.status === 2
    })
    this.dataWatcher = watchRoom({
      change: (newRoomInfo) => {
        this.setData({
          players: newRoomInfo.players,
          msgList: newRoomInfo.msgList,
          finished: newRoomInfo.status === 2
        })
      }
    })
    if (!roomInfoWatcher) {
      roomInfoWatcher = watchRoom({
        change: (newRoomInfo) => {
          newRoomInfo.selfIndex = roomInfo.selfIndex
          app.globalData.roomInfo = newRoomInfo
        }
      })
    }
    if (query.exit) {
      this.quitRoom();
    }
  },
  onUnload() {
    this.dataWatcher.close()
  },
  onShareAppMessage() {
    return {
      title: '来和我一决高下吧',
      path: '/pages/room/index?room=' + this.data.roomId,
      success() {
        wx.showToast({ title: '邀请成功' })
      }
    }
  },
  navBack() {
    wx.navigateBack({ delta: 1 })
  },
  inputReply(event) {
    this.setData({ replyContent: event.detail.value })
  },
  sendReply() {
    if (!this.data.replyContent) {
      return
    }
    const now = Date.now();
    const lastReplyTs = parseInt(wx.getStorageSync('__last_reply_time')) || 0;
    if (now < lastReplyTs + REPLY_INTERVAL_THRESHOLD) {
      wx.showModal({
        title: '提示',
        content: '回复太频繁，过5秒再发吧',
        confirmText: '我知道了',
        showCancel: false
      })
      return;
    }
    sendReply({
      data: {
        content: this.data.replyContent
      },
      fail(res) {
        wx.showModal({
          title: '提示',
          content: res.error,
          confirmText: '我知道了',
          showCancel: false
        })
      }
    })
    this.setData({ replyContent: '' })
    wx.setStorageSync('__last_reply_time', now)
  },
  goToTimer() {
    wx.switchTab({
      url: '/pages/timer/index'
    })
  },
  quitRoom() {
    wx.showModal({
      title: '提示',
      content: '退出比赛房间后将无法重新进入，确认退出房间？',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          quitRoom({
            complete: () => {
              if (roomInfoWatcher) {
                roomInfoWatcher.close()
                roomInfoWatcher = null
              }
              this.saveResult();
              app.globalData.roomInfo = {};
              for (let i = app.globalData.groups.length - 1; i > -1; i--) {
                if (!app.globalData.groups[i].roomId) {
                  app.globalData.current = i
                  break
                }
              }
              wx.navigateBack();
            }
          })
        }
      }
    })
  },
  triggerResult() {
    const { current, roomInfo } = app.globalData
    if (roomInfo.status === 2) {
      this.saveResult();
      wx.navigateTo({
        url: '/pages/room/detail/index?index=' + current
      })
    } else {
      this.setData({ result: !this.data.result })
    }
  },
  hideResult() {
    this.setData({ result: false })
  },
  saveResult() {
    const { current, groups, roomInfo } = app.globalData
    const curGroup = groups[current]
    let dnsNum =  roomInfo.solveNum - curGroup.details.length
    while (dnsNum > 0) {
      dnsNum--
      curGroup.details.push({
        origin: 100001,
        time: 100001,
        cond: 0,
        scramble: '', 
        create: today()
      })
    }
    curGroup.roomPlayers = roomInfo.players
    curGroup.roomStatus = roomInfo.status
    app.saveGroups()
  },
  noop() { }
})
