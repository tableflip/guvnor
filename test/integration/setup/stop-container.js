var child_process = require('child_process')
var path = require('path')

module.exports = function stopContainer (tag, callback) {
  child_process.execFile('docker', [
    'stop',
    tag
  ], {
    cwd: path.resolve(__dirname, '../../../')
  }, function (error) {
    callback(error)
  })
}
