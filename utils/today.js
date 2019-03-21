function today() {
  const d = new Date()
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
    + ' ' + d.getHours() + ':' + d.getMinutes()
}

module.exports = today