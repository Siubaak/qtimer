# QTimer

可能是小程序中最好用的魔方计时器。

# 使用

![](https://raw.githubusercontent.com/Siubaak/qtimer/master/qrcode.jpg)

# 热更新

计时器中的打乱公式生成模块是基于[Sval](https://github.com/Siubaak/sval)实现热更新的，因为打乱公式生成是CPU密集型操作，放在了Worker里跑。

首先`patch`目录里均为热更新模块，打包发布到[Unpkg](https://unpkg.com/qtimer)上。初始化的时候，检查热更新模块版本，然后判断是否需要更新，如果需要则再将热更新模块拉回来，存在LocalStorage里。

```js
// utils/patch.js
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
```

然后Worker很简单，就是根据拉回来的代码，直接运行，然后将需要用的方法export出来

```js
// workers/hotload.js
const interpreter = require('interpreter/index.js')

worker.onMessage(req => {
  if (req.type === 'run') {
    interpreter.run(req.data)
  } else if (req.type === 'types') {
    worker.postMessage({
      type: 'types',
      data: interpreter.exports.supportedTypes
    })
  } else {
    worker.postMessage({
      type: req.type,
      data: interpreter.exports.generateScramble(req.type)
    })
  }
})
```

因为小程序本身禁用了`eval`、`new Function`、`setTimeout`，所以interpreter就是通过Sval构造的解析器

```js
// workers/interpreter/index.js
const Sval = require('sval.min.js')
const init = require('init.js')

const interpreter = new Sval()

interpreter.run(init)

module.exports = interpreter
```