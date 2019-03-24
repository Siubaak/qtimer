function appendMoves(sequence, axsl, tl, la) {
  for (var sl = 0; sl < tl; sl++) {
    if (axsl[sl]) {
      var q = axsl[sl] - 1;
      var sa = la;
      var m = sl;
      if (sl + sl + 1 >= tl) {
        sa += 3;
        m = tl - 1 - m;
        q = 2 - q;
      }
      sequence[sequence.length] = (m * 6 + sa) * 4 + q;
    }
  }
}

function scramble(size, sequenceLength) {
  var sequence = [];
  var tl = size - 1;
  var axsl = [tl];
  var axam = [0, 0, 0];
  var la = -1;
  for (var i = 0; i < tl; i++)
    axsl[i] = 0;
  axam[0] = axam[1] = axam[2] = 0;
  var moved = 0;
  while (sequence.length + moved < sequenceLength) {
    var ax, sl, q;
    do {
      do {
        ax = Math.floor(Math.random() * 3);
        sl = Math.floor(Math.random() * tl);
        q = Math.floor(Math.random() * 3);
      } while (ax === la && axsl[sl] !== 0);
    } while (ax === la);
    if (ax != la) {
      appendMoves(sequence, axsl, tl, la);
      for (i = 0; i < tl; i++)
        axsl[i] = 0;
      axam[0] = axam[1] = axam[2] = 0;
      moved = 0;
      la = ax;
    }
    axam[q]++;
    moved++;
    axsl[sl] = q + 1;
  }
  appendMoves(sequence, axsl, tl, la);
  sequence[sequence.length] = 0;
  return sequence
}

function scrambleString(sequence) {
  var scramble = '', j;
  for (var i = 0; i < sequence.length - 1; i++) {
    if (i !== 0) scramble += ' ';
    var k = sequence[i] >> 2;
    j = k % 6;
    k = (k - j) / 6;
    if (k) {
      scramble += ['Dw', 'Lw', 'Bw', 'Uw', 'Rw', 'Fw'][j]
    } else {
      scramble += 'DLBURF'.charAt(j);
    }
    j = sequence[i] & 3;
    if (j !== 0) scramble += ' 2\''.charAt(j);
  }
  return scramble;
}

var scrambleLenMap = { 2: 10, 3: 20, 4: 45, 5: 60, 6: 80, 7: 100 };
function scrambler(size) {
  return function () {
    var sequence = scramble(size, scrambleLenMap[size]);
    return scrambleString(sequence);
  }
}

export default {
  '2x2': scrambler(2),
  '3x3': scrambler(3),
  '4x4': scrambler(4),
  '5x5': scrambler(5),
  '6x6': scrambler(6),
  '7x7': scrambler(7)
}