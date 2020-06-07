const app = getApp();
const today = require('../../utils/today.js')
const { watchRoom, sendReply, quitRoom } = require('../../utils/cloud.js')

const REPLY_INTERVAL_THRESHOLD = 5 * 1000 // 至少间隔5s才能发送一条消息

let roomInfoWatcher = null

Page({
  data: {
    roomId: '',
    lastReplyTs: 0,
    replyContent: '',
    selfIndex: '',
    players: [],
    msgList: []
  },
  onLoad() {
    const { roomInfo } = app.globalData
    this.setData({
      roomId: roomInfo.id,
      msgList: roomInfo.msgList,
      players: roomInfo.players,
      selfIndex: roomInfo.selfIndex
    })
    this.dataWatcher = watchRoom({
      change: (newRoomInfo) => {
        this.setData({
          players: newRoomInfo.players,
          msgList: newRoomInfo.msgList
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
  },
  onUnload() {
    this.dataWatcher.close()
  },
  onShareAppMessage() {
    return {
      title: '来和我一决高下吧',
      path: '/pages/data/join/index?room=' + this.data.roomId,
      success() {
        wx.showToast({ title: '邀请成功' })
      }
    }
  },
  inputReply(event) {
    this.setData({ replyContent: event.detail.value })
  },
  sendReply() {
    if (!this.data.replyContent) {
      return
    }
    const now = Date.now();
    if (now < this.data.lastReplyTs + REPLY_INTERVAL_THRESHOLD) {
      wx.showModal({
        title: '提示',
        content: '回复太频繁，过会再发吧',
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
    this.setData({
      replyContent: '',
      lastReplyTs: now
    })
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
      success(res) {
        if (res.confirm) {
          quitRoom({
            complete() {
              if (roomInfoWatcher) {
                roomInfoWatcher.close()
                roomInfoWatcher = null
              }
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
              app.saveGroups()
              app.globalData.roomInfo = {};
              wx.navigateBack();
            }
          })
        }
      }
    })
  },
  showResult() {
    console.log('fuck');
  }
})
