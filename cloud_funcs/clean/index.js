const cloud = require('wx-server-sdk')

cloud.init({ env: 'qtimer' })

const db = cloud.database()
const _ = db.command

// 删除过期房间
exports.main = async () => {
  const now = Date.now() - 12 * 60 * 60 * 1000 // 清除12小时再往前的比赛房间

  try {
    return await db.collection('room')
      .where({
        create: _.lt(now)
      })
      .remove()
  } catch (e) {
    console.error(e)
  }
}