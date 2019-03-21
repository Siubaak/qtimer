import scramble_3x3 from './scramble/3x3'

const handlerMap = {
  // '2x2': ,
  '3x3': scramble_3x3,
  // '4x4': ,
  // '5x5': ,
  // '6x6': ,
  // '7x7': ,
  // CLK: ,
  // MEG: ,
  // PYR: ,
  // SKB: ,
  // SQ1: ,
  '3x3-OH': scramble_3x3,
  '3x3-WF': scramble_3x3,
  // '3x3-BF': ,
  // '4x4-BF': ,
  // '5x5-BF': ,
}

exports.supportedTypes = Object.keys(handlerMap)

exports.generateScramble = function (type) {
  if (exports.supportedTypes.indexOf(type) === -1) {
    return 'Unsupported Cube Type'
  } else {
    return handlerMap[type]()
  }
}