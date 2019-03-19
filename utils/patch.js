const Sval = require('sval')
const interpreter = new Sval()

const version = wx.getStorageSync('__generate_scramble__version')
const code = wx.getStorageSync('__generate_scramble')

// wx.request({
//   url: ''
// })

interpreter.run(`
exports.supportedTypes = ['3x3']
exports.generateScramble = function (type) {
  return 'R R R R R R R'
}
`)

// supportedTypes
// generateScramble
module.exports = interpreter.exports