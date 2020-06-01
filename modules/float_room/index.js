Component({
  methods: {
    enterRoom() {
      wx.navigateTo({
        url: `/pages/room/index`
      })
    }
  }
})