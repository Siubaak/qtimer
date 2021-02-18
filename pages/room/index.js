const app = getApp()
const today = require('../../utils/today.js')

Page({
  data: {
    current: 0,
    groups: {},
    curOpr: -1,
    creating: false,
    renameIndex: -1,
    nameContent: '',
    typeIndex: 0,
    dialogButtons: [{ text: '取消' }, { text: '确定' }],
    supportedTypes: ['3x3']
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
  createGroup(event) {
    if (event.detail.index === 1) {
      const { groups } = app.globalData
      groups.push({
        name: this.data.nameContent || '',
        type: this.data.supportedTypes[this.data.typeIndex] || '3x3',
        create: today(),
        details: []
      })
      const current = groups.length - 1
      app.globalData.current = current
  
      const groupList = this.getGroupList(groups)
  
      this.setData({ current: current, groups: groupList })
      
      app.saveCurrent()
      app.saveGroups()

      this.navBack()
    }
    this.closeCreateDialog()
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
  renameGroup(event) {
    if (event.detail.index === 1) {
      const { groups } = app.globalData
      const curGroup = groups[groups.length - this.data.renameIndex - 1]
      curGroup.name = this.data.nameContent

      const groupList = this.getGroupList(groups)
      this.setData({ groups: groupList })

      app.saveGroups()
    }
    this.closeRenameDialog()
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
    return groups.filter(i => !i.room)
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
