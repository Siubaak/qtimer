const app = getApp()
const today = require('../../utils/today.js')

Page({
  data: {
    showMoreOptions: false,

    group: {},

    groupIndex: 0,
    groupList: ['新建成绩分组'],

    typeIndex: 0,
    supportedTypes: ['3x3'],

    roomId: ''
  },
  onShow() {
    const { current, groups, roomInfo } = app.globalData
    const curGroup = groups[current]

    const groupList = this.getGroupList(groups)

    this.setData({
      roomId: roomInfo.id || '',
      group: curGroup,
      groupIndex: groups.length - current,
      groupList
    })
    
    app.getWorkerResult({
      type: 'types'
    }, ({ type, data }) => {
      if (type === 'types') {
        this.setData({
          supportedTypes: data,
          typeIndex: data.indexOf(curGroup.type)
        })
      }
    })
  },
  showMore() {
    this.setData({ showMoreOptions: !this.data.showMoreOptions })
  },
  nameGroup(event) {
    const { current, groups } = app.globalData
    const curGroup = groups[current]
    curGroup.name = event.detail.value
    
    const groupList = this.getGroupList(groups)
    this.setData({ groupList })

    app.saveGroups()
  },
  switchGroup(event) {
    const groupIndex = event.detail.value

    if (groupIndex === '0') { // 新建分组
      this.createGroup()
    } else {
      const { groups } = app.globalData
      const current = groups.length - groupIndex
      
      app.globalData.current = current
      const curGroup = groups[current]

      this.setData({
        group: curGroup,
        groupIndex,
        typeIndex: this.data.supportedTypes.indexOf(curGroup.type)
      })
      
      app.saveCurrent()
    }
    app.notifyData()
  },
  deleteGroup() {
    wx.showModal({
      title: '删除分组',
      content: '当前分组所有成绩将被清空，确定删除当前分组？',
      success: ({ confirm }) => {
        if (confirm) {
          const { current, groups } = app.globalData
          if (groups.length === 1) { // 只有一个分组，重置
            this.resetGroup(0)
          } else {
            groups.splice(current, 1)
            app.globalData.current = groups.length - 1
            const curGroup = groups[groups.length - 1]
            const groupIndex = 1
            
            const groupList = this.getGroupList(groups)

            this.setData({
              group: curGroup,
              groupIndex,
              groupList,
              typeIndex: this.data.supportedTypes.indexOf(curGroup.type)
            })
            
            app.saveCurrent()
            app.saveGroups()
          }
          app.notifyData()
        }
      }
    })
  },
  switchType(event) {
    const typeIndex = event.detail.value
    const { current, groups } = app.globalData
    groups[current].type = this.data.supportedTypes[typeIndex]
    const groupList = this.getGroupList(groups)
    this.setData({ typeIndex, groupList })
    app.saveGroups()
  },
  getGroupList(groups) {
    const groupList = ['新建成绩分组']
    for (let i = groups.length - 1; i > -1; i--) {
      groupList.push(`${groups[i].name || '未命名分组'} (${groups[i].type})`)
    }
    return groupList
  },
  createGroup() {
    const { groups } = app.globalData
    const curGroup = {
      name: '',
      create: today(),
      type: '3x3',
      details: []
    }
    groups.push(curGroup)
    app.globalData.current = groups.length - 1

    const groupList = this.getGroupList(groups)

    this.setData({
      group: curGroup,
      groupIndex: 1,
      groupList,
      typeIndex: this.data.supportedTypes.indexOf(curGroup.type)
    })
    
    app.saveCurrent()
    app.saveGroups()
  },
  resetGroup(index) {
    const { groups } = app.globalData
    const curGroup = groups[index]
    curGroup.name = ''
    curGroup.create = today()
    curGroup.type = '3x3'
    curGroup.details = []
    app.globalData.current = index

    const groupList = this.getGroupList(groups)

    this.setData({
      group: curGroup,
      groupIndex: groups.length - index,
      groupList,
      typeIndex: this.data.supportedTypes.indexOf(curGroup.type)
    })
    
    app.saveCurrent()
    app.saveGroups()
  },
  navigateToRoom(event) {
    wx.navigateTo({
      url: event.currentTarget.id + '/index'
    })
  }
})
