module.exports = `
exports.supportedTypes = ['3x3']
exports.generateScramble = function (type) {
  if (exports.supportedTypes.indexOf(type) === -1) {
    return 'Unsupported Cube Type'
  } else {
    const cubeArr = []
    const cube = ['R', 'L', 'F', 'B', 'U', 'D']
    const types = ['', '', "'", "'", '2']
    const checkmove = (move, arr) => {
      const l = arr.length
      return move == arr[l - 1] || (move == arr[l - 2] && (move / 2 | 0) == (arr[l - 1] / 2 | 0))
    }
    let cubeStr = ''
    for (let i = 0; i < 25; i++) {
      let r
      do {
        r = Math.random() * 6 | 0
      } while (checkmove(r, cubeArr))
      cubeArr.push(r)
      cubeStr += cube[r] + types[Math.random() * 5 | 0] + ' '
    }
    return cubeStr
  }
}
`