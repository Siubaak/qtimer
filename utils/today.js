function fill(num) {
  const str = '0' + num
  return str.substring(str.length - 2)
}

function today(d = new Date()) {
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
    + ' ' + d.getHours() + ':' + fill(d.getMinutes())
}

module.exports = today