const Sval = require('./sval.min.js')
const init = require('./init.js')

const interpreter = new Sval()

interpreter.run(init)

module.exports = interpreter