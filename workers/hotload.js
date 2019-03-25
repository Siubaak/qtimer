const interpreter = require('interpreter/index.js')

worker.onMessage(req => {
  if (req.type === 'run') {
    interpreter.run(req.data)
  } else if (req.type === 'types') {
    worker.postMessage({
      data: interpreter.exports.supportedTypes
    })
  } else {
    worker.postMessage({
      data: interpreter.exports.generateScramble(req.type)
    })
  }
})