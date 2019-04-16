var length = 70;
export default function scrambler() {
  var scramble = '';
  for (var i = 0; i < length; i++) {
    var sequence = Math.floor(Math.random() * 2);
    if (i % 2) {
      if (sequence) {
        scramble += 'D++ ';
      } else {
        scramble += 'D-- ';
      }
    } else {
      if (sequence) {
        scramble += 'R++ ';
      } else {
        scramble += 'R-- ';
      }
    }
    if (i % 10 === 9) {
      if (sequence) {
        scramble += 'U ';
      } else {
        scramble += 'U\' ';
      }
    }
  }
  return scramble;
}
