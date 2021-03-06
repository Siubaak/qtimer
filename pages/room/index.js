const app = getApp()
const today = require('../../utils/today.js')
const { createRoom } = require('../../utils/cloud.js')

const CREATE_INTERVAL_THRESHOLD = 1000 // 至少间隔2min才能再尝试创建另外一个房间

Page({
  data: {
    current: 0,
    groups: {},
    curOpr: -1,
    creating: false,
    searching: false,
    renameIndex: -1,
    nameContent: '',
  
    dialogButtons: [{ text: '取消' }, { text: '确定' }],
    searchButtons: [{ text: '取消' }, { text: '加入' }],
  
    typeIndex: 0,
    supportedTypes: ['3x3'],
  
    playerIndex: 0,
    supportedPlayers: [2, 3, 4, 5],

    timeIndex: 1,
    supportedTimes: [3, 5, 12]
  },
  onShow() {
    const { groups, current } = app.globalData
    const groupList = this.getGroupList(groups)
    this.setData({ current, groups: groupList })

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
    this.closeCreateDialog()
    if (event.detail.index === 1) {
      const now = Date.now()
      const lastCreateTs = parseInt(wx.getStorageSync('__last_create_room')) || 0
      if (now < lastCreateTs + CREATE_INTERVAL_THRESHOLD) {
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
        success: (userInfo) => {
          app.globalData.userInfo = userInfo
          this.createRoomAfterGetUserInfo(userInfo, now)
        },
        fail: () => {
          wx.hideLoading()
          wx.showModal({
            title: '创建房间失败',
            content: '无法获取您的头像和昵称信息',
            confirmText: '我知道了',
            showCancel: false
          })
        }
      })
    }
  },
  createRoomAfterGetUserInfo(userInfo, now) {
    createRoom({
      data: {
        name: this.data.nameContent,
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
      complete: () => wx.hideLoading()
    })
    wx.setStorageSync('__last_create_room', now)
  },
  createGroup(roomInfo) {
    const { groups } = app.globalData
    const curGroup = {
      room: true,
      name: this.data.nameContent,
      create: today(new Date(roomInfo.create)),
      type: roomInfo.type,
      details: []
    }
    groups.push(curGroup)
    app.globalData.current = groups.length - 1
  
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
  showSearchDialog() {
    this.setData({ searching: true })
  },
  closeSearchDialog() {
    this.setData({ nameContent: '', searching: false })
  },
  joinRoom(event) {
    this.closeSearchDialog()
    if (event.detail.index === 1) {
    }
  },
  renameRoom(event) {
    this.closeRenameDialog()
    if (event.detail.index === 1) {
      const { groups } = app.globalData
      const curGroup = groups[groups.length - this.data.renameIndex - 1]
      curGroup.name = this.data.nameContent

      const groupList = this.getGroupList(groups)
      this.setData({ groups: groupList })

      app.saveGroups()
    }
  },
  deleteGroup() {
    const { current, groups } = app.globalData
    if (groups.length === 1) { // 只有一个分组，重置
      wx.showModal({
        title: '重置',
        content: '当前分组所有成绩将被清空，确定重置当前分组？',
        success: ({ confirm }) => {
          if (confirm) {
            this.resetGroup(0)
          }
        }
      })
    } else {
      wx.showModal({
        title: '删除',
        content: '当前分组所有成绩将被清空，确定删除当前分组？',
        success: ({ confirm }) => {
          if (confirm) {
            groups.splice(current, 1)
            const newCurrent = groups.length - 1
            app.globalData.current = newCurrent

            const groupList = this.getGroupList(groups)
            this.setData({ current: newCurrent, groups: groupList })

            app.saveCurrent()
            app.saveGroups()
          }
        }
      })
    }
    this.hideAllGroupOpr()
  },
  resetGroup(index) {
    const { groups } = app.globalData
    const group = groups[index]
    group.create = today()
    group.details = []
    app.globalData.current = index

    const groupList = this.getGroupList(groups)

    this.setData({
      current: groups.length - index - 1,
      groups: groupList,
    })
    
    app.saveCurrent()
    app.saveGroups()
  },
  getGroupList(groups) {
    return groups.filter(i => i.room)
  },
  switchGroup(event) {
    const { groups } = app.globalData
    const current = groups.length - event.currentTarget.id * 1 - 1
    app.globalData.current = current
    app.saveCurrent()
    this.setData({ current })
    this.navBack()
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
