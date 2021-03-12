const app = getApp()
const today = require('../../utils/today.js')
const { createRoom, joinRoom } = require('../../utils/cloud.js')

const CREATE_INTERVAL_THRESHOLD = /*2 * 60 **/ 1000 // 至少间隔2min才能再尝试创建另外一个房间
const JOIN_INTERVAL_THRESHOLD = 10 * 1000 // 至少间隔10s才能再尝试加入另外一个房间

Page({
  data: {
    current: 0,
    groups: {},
    curOpr: -1,
    creating: false,
    searching: false,
    renameIndex: -1,
    nameContent: '',
    roomId: '',
  
    dialogButtons: [{ text: '取消' }, { text: '确定' }],
    searchButtons: [{ text: '取消' }, { text: '加入' }],
  
    typeIndex: 0,
    supportedTypes: ['3x3'],
  
    playerIndex: 0,
    supportedPlayers: [2, 3, 4, 5],

    timeIndex: 1,
    supportedTimes: [3, 5, 12]
  },
  onLoad(query) {
    if (query.room) {
      const { roomInfo } = app.globalData
      if (roomInfo.id) {
        if (roomInfo.id === query.room) {
          wx.navigateTo({
            url: `/pages/room/chat/index`
          })
        } else {
          wx.showModal({
            title: '加入房间失败',
            content: '已加入房间，无法加入其他房间',
            confirmText: '我知道了',
            showCancel: false
          })
        }
      } else {
        this.showSearchDialog()
        this.setData({ nameContent: query.room })
      }
    }
  },
  onShow() {
    const { groups, current, roomInfo } = app.globalData
    const groupList = this.getGroupList(groups)
    this.setData({ roomId: roomInfo.id || '', current, groups: groupList })

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
  navBack() {
    wx.navigateBack({ delta: 1 })
  },
  showCreateDialog() {
    this.setData({ creating: true })
  },
  closeCreateDialog() {
    this.setData({
      typeIndex: this.data.supportedTypes.indexOf('3x3'),
      creating: false,
      nameContent: ''
    })
  },
  selectType(event) {
    this.setData({ typeIndex: event.currentTarget.id * 1 })
  },
  createRoom(event) {
    if (event.detail.index === 1) {
      const now = Date.now()
      const lastCreateTs = parseInt(wx.getStorageSync('__last_create_room')) || 0
      if (now < lastCreateTs + CREATE_INTERVAL_THRESHOLD) {
        this.closeCreateDialog()
        wx.showModal({
          title: '提示',
          content: '创建房间太频繁，过2分钟再试吧',
          confirmText: '我知道了',
          showCancel: false
        })
        return
      }
      wx.showLoading({ title: '正在创建房间', mask: true })
      if (app.globalData.userInfo) {
        this.createRoomAfterGetUserInfo(app.globalData.userInfo, now)
        return
      }
      wx.getUserProfile({
        desc: '创建房间需要获取您的信息',
        success: ({ userInfo }) => {
          app.globalData.userInfo = userInfo
          this.createRoomAfterGetUserInfo(userInfo, now)
        },
        fail: () => {
          this.closeCreateDialog()
          wx.hideLoading()
          wx.showModal({
            title: '创建房间失败',
            content: '无法获取您的头像和昵称信息',
            confirmText: '我知道了',
            showCancel: false
          })
        }
      })
    } else {
      this.closeCreateDialog()
    }
  },
  createRoomAfterGetUserInfo(userInfo, now) {
    createRoom({
      data: {
        name: this.data.nameContent,
        type: this.data.supportedTypes[this.data.typeIndex],
        solveNum: 5, // this.data.supportedTimes[this.data.timeIndex],
        playerNum: 2, // this.data.supportedPlayers[this.data.playerIndex],
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      },
      success: ({ roomInfo }) => {
        app.globalData.roomInfo = roomInfo
        this.createGroup(roomInfo)
        this.setData({ roomId: roomInfo.id })
        wx.navigateTo({
          url: `/pages/room/chat/index`
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
      complete: () => {
        wx.hideLoading()
        this.closeCreateDialog()
      }
    })
    wx.setStorageSync('__last_create_room', now)
  },
  createGroup(roomInfo) {
    const { groups } = app.globalData
    groups.push({
      roomId: roomInfo.id,
      name: this.data.nameContent,
      create: today(new Date(roomInfo.create)),
      type: roomInfo.type,
      details: []
    })
    const current = groups.length - 1
    app.globalData.current = current

    const groupList = this.getGroupList(groups)

    this.setData({ current: current, groups: groupList })

    app.saveCurrent()
    app.saveGroups()
  },
  showRenameDialog(event) {
    this.setData({ renameIndex: event.currentTarget.id * 1 })
    this.hideAllGroupOpr()
  },
  closeRenameDialog() {
    this.setData({ nameContent: '', renameIndex: -1 })
  },
  inputingName(event) {
    this.setData({ nameContent: event.detail.value })
  },
  inputingPlayers(event) {
    const num = event.detail.value * 1
    const index = this.data.supportedPlayers.indexOf(num)
    if (index !== -1) {
      this.setData({ playerIndex: index })
    }
  },
  blurPlayers() {
    this.setData({ playerIndex: this.data.playerIndex })
  },
  inputingTimes(event) {
    const num = event.detail.value * 1
    const index = this.data.supportedTimes.indexOf(num)
    if (index !== -1) {
      this.setData({ timeIndex: index })
    }
  },
  blurTimes() {
    this.setData({ timeIndex: this.data.timeIndex })
  },
  showSearchDialog() {
    this.setData({ searching: true })
  },
  closeSearchDialog() {
    this.setData({ nameContent: '', searching: false })
  },
  enterRoom(event) {
    const index = event.currentTarget.id * 1
    if (this.data.current === index) { // 如果是当前房间，进入房间
      wx.navigateTo({
        url: `/pages/room/chat/index`
      })
    } else { // 如果不是当前房间，展示历史结果

    }
  },
  joinRoom(event) {
    if (event.detail.index === 1) {
      if (!/^\d{6}$/.test(this.data.nameContent)) {
        wx.showModal({
          title: '加入房间失败',
          content: '房间号为6位数字，请检查房间号是否输入正确',
          confirmText: '我知道了',
          showCancel: false
        })
        return
      }
      const now = Date.now();
      const lastJoinTs = parseInt(wx.getStorageSync('__last_join_room')) || 0;
      if (now < lastJoinTs + JOIN_INTERVAL_THRESHOLD) {
        wx.showModal({
          title: '提示',
          content: '加入房间太频繁，过10秒再试吧',
          confirmText: '我知道了',
          showCancel: false
        })
        return;
      }
      wx.showLoading({ title: '正在加入房间', mask: true })
      if (app.globalData.userInfo) {
        this.joinRoomAfterGetUserInfo(app.globalData.userInfo, now)
        return
      }
      wx.getUserProfile({
        desc: '加入房间需要获取您的信息',
        success: ({ userInfo }) => {
          app.globalData.userInfo = userInfo
          this.joinRoomAfterGetUserInfo(userInfo, now)
        },
        fail: () => {
          this.closeSearchDialog()
          wx.hideLoading()
          wx.showModal({
            title: '加入房间失败',
            content: '无法获取您的头像和昵称信息',
            confirmText: '我知道了',
            showCancel: false
          })
        }
      })
    } else {
      this.closeSearchDialog()
    }
  },
  joinRoomAfterGetUserInfo(userInfo, now) {
    joinRoom({
      data: {
        roomId: this.data.nameContent,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      },
      success: ({ roomInfo }) => {
        app.globalData.roomInfo = roomInfo
        this.createGroup(roomInfo)
        this.setData({ roomId: roomInfo.id })
        wx.navigateTo({
          url: `/pages/room/chat/index`
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
      complete: () => {
        wx.hideLoading()
        this.closeSearchDialog()
      }
    })
    wx.setStorageSync('__last_join_room', now)
  },
  renameRoom(event) {
    if (event.detail.index === 1) {
      const { groups } = app.globalData
      const curGroup = groups[this.data.renameIndex]
      curGroup.name = this.data.nameContent

      const groupList = this.getGroupList(groups)
      this.setData({ groups: groupList })

      app.saveGroups()
    }
    this.closeRenameDialog()
  },
  deleteGroup(event) {
    const index = event.currentTarget.id * 1
    if (this.data.current === index) { // 如果是当前房间，退出
      wx.navigateTo({
        url: `/pages/room/chat/index?exit=1`
      })
    } else { // 如果不是当前房间，删除
      wx.showModal({
        title: '删除',
        content: '房间内所有成绩将被清空，确定删除房间？',
        success: ({ confirm }) => {
          if (confirm) {
            const { groups } = app.globalData
            groups.splice(index, 1)

            const groupList = this.getGroupList(groups)

            if (this.data.current > index) {
              app.globalData.current = this.data.current - 1
              this.setData({ current: this.data.current - 1, groups: groupList })
            } else {
              this.setData({ groups: groupList })
            }

            app.saveCurrent()
            app.saveGroups()
          }
        }
      })
    }
    this.hideAllGroupOpr()
  },
  getGroupList(groups) {
    return groups.map((v, i) => Object.assign({ idx: i }, v)).filter(v => v.roomId)
  },
  showGroupOpr(index) {
    this.setData({ curOpr: index })
  },
  hideAllGroupOpr() {
    this.setData({ curOpr: -1 })
  },
  handleTouchStart(event) {
    this.startX = event.touches[0].pageX
  },
  handleTouchEnd(event) {
    if (
      event.changedTouches[0].pageX < this.startX && event.changedTouches[0].pageX - this.startX <= -30 // 右滑
      || event.changedTouches[0].pageX > this.startX && event.changedTouches[0].pageX - this.startX < 30 // 左滑
    ) {
      this.showGroupOpr(event.currentTarget.id * 1)
    } else {
      this.hideAllGroupOpr()
    }
  }
})
