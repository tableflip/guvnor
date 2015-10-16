var child_process = require('child_process')

module.exports = function findServerAddress (callback) {
  child_process.execFile('boot2docker', ['ip'], function (error, stdout) {
    var host = (stdout || 'localhost').trim()

    callback(null, host)
  })
}
