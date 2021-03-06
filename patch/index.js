import scramberNxN from './scramblers/nxn';
import scramberMega from './scramblers/mega';
// import scramberPyram from './scramblers/pyram';
// import scramberSkewb from './scramblers/skewb';
// import scramberSq1 from './scramblers/sq1';

// Pyram、Skewb、SQ1的打乱生成有毒，复杂度太高了

var handlerMap = {
  '2x2': scramberNxN['2x2'],
  '3x3': scramberNxN['3x3'],
  '4x4': scramberNxN['4x4'],
  '5x5': scramberNxN['5x5'],
  '6x6': scramberNxN['6x6'],
  '7x7': scramberNxN['7x7'],
  '3x3-OH': scramberNxN['3x3'],
  '3x3-WF': scramberNxN['3x3'],
  // 'Square-1': scramberSq1,
  // 'Pyraminx': scramberPyram,
  // 'Skewb': scramberSkewb,
  'Megaminx': scramberMega,
  // 'Clock': getScramble.bind(null, 'clock', 16)
};

exports.supportedTypes = Object.keys(handlerMap);

exports.generateScramble = function (type) {
  if (exports.supportedTypes.indexOf(type) === -1) {
    return 'Unsupported Cube Type';
  } else {
    return handlerMap[type]();
  }
};

// exports.supportedTypes = ['3x3']
// exports.generateScramble = function (type) {
//   if (exports.supportedTypes.indexOf(type) === -1) {
//     return 'Unsupported Cube Type'
//   } else {
//     var cubeArr = []
//     var cube = ['R', 'L', 'F', 'B', 'U', 'D']
//     var types = ['', '', "'", "'", '2']
//     var checkmove = function (move, arr) {
//       var l = arr.length
//       return move == arr[l - 1] || (move == arr[l - 2] && (move / 2 | 0) == (arr[l - 1] / 2 | 0))
//     }
//     var cubeStr = ''
//     for (var i = 0; i < 25; i++) {
//       var r
//       do {
//         r = Math.random() * 6 | 0
//       } while (checkmove(r, cubeArr))
//       cubeArr.push(r)
//       cubeStr += cube[r] + types[Math.random() * 5 | 0] + ' '
//     }
//     return cubeStr
//   }
// }