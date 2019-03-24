const interpreter = require('./interpreter/index.js')

worker.onMessage(req => {
  if (req.type === 'run') {
    interpreter.run(req.data)
  } else if (req.type === 'types') {
    worker.postMessage(interpreter.exports.supportedTypes)
  } else {
    worker.postMessage(interpreter.exports.generateScramble(req.type))
  }
})