import Scrambo from 'scrambo'

function getScramble(type, steps) {
  var scramble = new Scrambo().type(type)
  if (['444', '555', '666', '777', 'minx'].indexOf(type) !== -1) {
    scramble = scramble.length(steps)
  }
  return scramble.get()
}

var handlerMap = {
  '2x2': getScramble.bind(null, '222', 10),
  '3x3': getScramble.bind(null, '333', 20),
  '4x4': getScramble.bind(null, '444', 45),
  '5x5': getScramble.bind(null, '555', 60),
  '6x6': getScramble.bind(null, '666', 80),
  '7x7': getScramble.bind(null, '777', 100),
  '3x3-OH': getScramble.bind(null, '333', 25),
  '3x3-WF': getScramble.bind(null, '333', 25),
  'Square-1': getScramble.bind(null, 'sq1', 12),
  'Pyraminx': getScramble.bind(null, 'pyram', 12),
  'Skewb': getScramble.bind(null, 'skewb', 8),
  'Megaminx': getScramble.bind(null, 'minx', 75),
  'Clock': getScramble.bind(null, 'clock', 16)
}

exports.supportedTypes = Object.keys(handlerMap)

exports.generateScramble = function (type) {
  if (exports.supportedTypes.indexOf(type) === -1) {
    return 'Unsupported Cube Type'
  } else {
    return handlerMap[type]()[0]
  }
}