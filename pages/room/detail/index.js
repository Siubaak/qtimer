const app = getApp()

function avg(details) {
  let sum = 0, dnf = 0
  for (let i = 0; i < details.length; i++) {
    const d = details[i]
    sum += d
    if (d === 100000 || d === 100001) dnf++
  }
  if (dnf > 0) {
    return 100000
  } else {
    return sum / details.length
  }
}

function avgCut(details) {
  let sum = 0, dnf = 0, best = Infinity, worst = 0
  for (let i = 0; i < details.length; i++) {
    const d = details[i]
    sum += d
    best = Math.min(d, best)
    worst = Math.max(d, worst)
    if (d === 100000 || d === 100001) dnf++
  }
  if (dnf > 1) {
    return 100000
  } else {
    return (sum - best - worst) / (details.length - 2)
  }
}

Page({
  data: {
    group: {},
    players: [],
    status: 0
  },
  onLoad(query) {
    const { current, groups } = app.globalData
    const curGroup = groups[query.index] || groups[current]
    this.setData({ group: curGroup })

    if (groups[query.index]) {
      const status = groups[query.index].roomStatus
      const players = groups[query.index].roomPlayers
      if (players && players.length) {
        this.setData({
          status: status,
          players: players
            .map(p => Object.assign({
              avg: p.details.length > 3 ? avgCut(p.details) : avg(p.details)
            }, p))
            .sort((a, b) => a.avg - b.avg)
        })
      }
    }
  },
  navBack() {
    wx.navigateBack({ delta: 1 })
  }
})
