const cloud = require('wx-server-sdk')

cloud.init({ env: 'qtimer' })

const join = require('./controllers/join')
const end = require('./controllers/end')

// 维护房间状态
exports.main = async (event) => {
  if (event.action === 'join') {
    return await join(event.params)
  } else if (event.action === 'end') {
    return await end(event.params)
  } else {
    return {
      ret: -1,
      error: '接口错误，请稍后再试'
    }
  }
}