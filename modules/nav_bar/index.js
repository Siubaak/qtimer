Component({
  properties: {
    title: {
      type: String,
      value: 'QTimer'
    }
  },
  lifetimes: {
    attached() {
      this.setNavSize();
    }
  },
  data: {
    status: 0,
    navHeight: 44
  },
  methods: {
    // 通过获取系统信息计算导航栏高度
    setNavSize() {
      const sysinfo = wx.getSystemInfoSync()
      const statusHeight = sysinfo.statusBarHeight
      const isiOS = sysinfo.system.indexOf('iOS') > -1
      let navHeight;
      if (!isiOS) {
        navHeight = 48
      } else {
        navHeight = 44
      }
      this.setData({
        status: statusHeight,
        navHeight: navHeight
      })
    }
  }
})