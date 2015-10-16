var child_process = require('child_process')
var path = require('path')

module.exports = function stopContainer (tag, callback) {
  child_process.execFile('docker', [
    'kill',
    tag
  ], {
    cwd: path.resolve(__dirname, '../../../')
  }, function (error) {
    callback(error)
  })
}
