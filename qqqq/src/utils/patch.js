import Sval from 'sval'
import init from './init.js'

const interpreter = new Sval()

const version = wx.getStorageSync('__generate_scramble__version')
const code = wx.getStorageSync('__generate_scramble')

if (code) {
  interpreter.run(code)
} else {
  interpreter.run(init)
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
          if (!code) {
            interpreter.run(code)
          }
        }
      })
    }
  }
})

// supportedTypes
// generateScramble
export default interpreter.exports