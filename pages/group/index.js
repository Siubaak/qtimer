const app = getApp()
const today = require('../../utils/today.js')
const { supportedTypes } = require('../../utils/patch.js')

Page({
  data: {
    group: {},

    groupIndex: '0',
    groupList: ['新建成绩分组'],

    typeIndex: '0',
    supportedTypes
  },
  onShow() {
    const { current, groups } = app.globalData
    const curGroup = groups[current]

    const groupList = this.getGroupList(groups)
    const curGroupName = this.getGroupName(groups, current)

    this.setData({
      group: curGroup,

      groupIndex: groupList.indexOf(curGroupName),
      groupList,
      
      typeIndex: supportedTypes.indexOf(curGroup.type)
    })
  },
  switchGroup(event) {
    const groupIndex = event.detail.value

    if (groupIndex === '0') { // 新建分组
      const { groups } = app.globalData
      const curGroup = {
        create: today(),
        type: '3x3',
        details: []
      }
      groups.push(curGroup)
      app.globalData.current++

      const groupList = this.getGroupList(groups)
      const curGroupName = this.getGroupName(groups, app.globalData.current)

      this.setData({
        group: curGroup,
  
        groupIndex: groupList.indexOf(curGroupName),
        groupList,
        
        typeIndex: supportedTypes.indexOf(curGroup.type)
      })
      
      app.saveCurrent()
      app.saveGroups()
    } else {
      const { groups } = app.globalData
      const current = groups.length - groupIndex
      
      app.globalData.current = current
    
      const curGroup = groups[current]

      this.setData({
        group: curGroup,
  
        groupIndex,
        
        typeIndex: supportedTypes.indexOf(curGroup.type)
      })
      
      app.saveCurrent()
    }
  },
  deleteGroup() {
    console.log(1)
  },
  switchType(event) {
    const typeIndex = event.detail.value
    this.setData({ typeIndex })

    const { current, groups } = app.globalData
    groups[current].type = supportedTypes[typeIndex]
    app.saveGroups()
  },
  getGroupList(groups) {
    const groupList = ['新建成绩分组']
    for (let i = groups.length - 1; i > -1; i--) {
      groupList.push(this.getGroupName(groups, i))
    }
    return groupList
  },
  getGroupName(groups, current) {
    const curGroup = groups[current]
    return (current + 1) + '. ' + curGroup.type + ' (' + curGroup.create + ')'
  }
})
