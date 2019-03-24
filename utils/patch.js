module.exports = function patch(worker) {
  const version = wx.getStorageSync('__generate_scramble__version')
  const code = wx.getStorageSync('__generate_scramble')

  if (code) {
    worker.postMessage({
      type: 'run',
      data: code
    })
  }

  wx.request({
    url: 'https://unpkg.com/qtimer?meta',
    success(res) {
      const integrity = res.data.integrity
      if (integrity && integrity !== version) {
        wx.request({
          url: 'https://unpkg.com/qtimer',
          success(res) {
            wx.setStorageSync('__generate_scramble__version', integrity)
            wx.setStorageSync('__generate_scramble', res.data)
            worker.postMessage({
              type: 'run',
              data: res.data
            })
          }
        })
      }
    }
  })
}