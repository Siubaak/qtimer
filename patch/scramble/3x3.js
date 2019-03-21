// 临时测试算法，以后计划参考csTimer打乱算法

const checkmove = (move, arr) => { // 检测步骤合理性
  const l = arr.length
  return move == arr[l - 1] || (move == arr[l - 2] && (move / 2 | 0) == (arr[l - 1] / 2 | 0))
}

export default () => { // 生成随机打乱步骤
  const cubeArr = [] // 打乱步骤数组
  const cube = ['R', 'L', 'F', 'B', 'U', 'D'] // 步骤
  const types = ['', '', "'", "'", '2'] // 步骤附加条件
  
  let cubeStr = '' // 打乱步骤字符串

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