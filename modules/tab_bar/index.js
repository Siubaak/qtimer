Component({
  properties: {
    idx: {
      type: Number,
      value: 0
    }
  },
  methods: {
    navPage(event) {
      const id = event.currentTarget.id * 1
      if (id === this.data.idx) return
      switch (id) {
        case 2: wx.switchTab({ url: '/pages/me/index' }); break
        case 1: wx.switchTab({ url: '/pages/room/index' }); break
        default: wx.switchTab({ url: '/pages/timer/index' })
      }
    },
  }
})