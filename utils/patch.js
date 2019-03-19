const Sval = require('sval')
const interpreter = new Sval()

const version = wx.getStorageSync('__generate_scramble__version')
const code = wx.getStorageSync('__generate_scramble')

wx.request({
  url: 'https://unpkg.com/qtimer?meta',
  success(res) {
    const integrity = res.data.integrity
    if (integrity !== version) {
      console.log('generate scramble update')
      wx.setStorageSync('__generate_scramble__version', integrity)
      wx.request({
        url: 'https://unpkg.com/qtimer',
        success(res) {
          wx.setStorageSync('__generate_scramble', res.data)
        }
      })
    } else {
      console.log('use cached generate scramble')
    }
  }
})

if (code) {
  interpreter.import({ Object, Math })
  interpreter.run(code)
}

// supportedTypes
// generateScramble
module.exports = interpreter.exports