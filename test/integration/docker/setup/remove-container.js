var child_process = require('child_process')
var path = require('path')

module.exports = function removeContainer (tag, callback) {
  child_process.execFile('docker', [
    'rm',
    tag
  ], {
    cwd: path.resolve(__dirname, '../../../')
  }, function (error) {
    callback(error)
  })
}
