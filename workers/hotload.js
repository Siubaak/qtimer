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
    var time = Date.now()
    worker.postMessage({
      type: req.type,
      data: interpreter.exports.generateScramble(req.type)
    })
    console.log(Date.now() - time)
  }
})