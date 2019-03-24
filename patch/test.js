const fs = require('fs')
const path = require('path')
const Sval = require('sval')

const interpreter = new Sval()
const code = fs.readFileSync(path.resolve(__dirname, 'dist/qtimer.min.js'), 'utf-8')

interpreter.run(code)

console.log(interpreter.exports.generateScramble('Clock'))