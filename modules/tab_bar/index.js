Component({
  attached() {
    this.setData({
      idx: wx.getStorageSync('__current_tab_id') * 1 || 0
    })
  },
  data: {
    idx: wx.getStorageSync('__current_tab_id') * 1 || 0
  },
  methods: {
    navPage(e) {
      const id = e.currentTarget.id * 1
      if (id === this.idx) return

      this.setData({ idx: id })

      wx.setStorageSync('__current_tab_id', id)

      switch (id) {
        case 2: wx.reLaunch({ url: '/pages/data/index' }); break
        default: wx.reLaunch({ url: '/pages/timer/index' })
      }
    },
  }
})