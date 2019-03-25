export default function scrambler() {
  var scramble = '';
  for (var i = 0; i < 70; i++) {
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
  }
  scramble += 'U\'';
  return scramble;
}