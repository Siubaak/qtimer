const app = getApp();
const REPLY_INTERVAL_THRESHOLD = 5 * 1000; // 至少间隔5s才能发送一条消息

Page({
  data: {
    roomId: '',
    selfAvatar: '',
    selfNickName: '',
    replyContent: '',
    lastReplyTs: 0,
    msgList: []
  },
  onLoad(query) {
    const { room } = app.globalData
    this.setData({
      roomId: room.id,
      selfAvatar: room.self.avatarUrl,
      selfNickName: room.self.nickName,
      msgList: [
        {
          system: true,
          avatar: room.self.avatarUrl,
          nickName: room.self.nickName,
          content: '加入房间' + room.id
        }
      ]
    })
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
    this.setData({
      replyContent: '',
      lastReplyTs: now,
      msgList: this.data.msgList.concat({
        avatar: this.data.selfAvatar,
        nickName: this.data.selfNickName,
        content: this.data.replyContent
      })
    })
  },
  goToTimer() {
    wx.switchTab({
      url: '/pages/timer/index'
    })
  },
  quitRoom() {
    app.globalData.room = {};
    wx.navigateBack();
  },
  showResult() {
    console.log('fuck');
  }
})
