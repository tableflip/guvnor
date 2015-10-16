var child_process = require('child_process')

module.exports = function startContainer (callback) {
  child_process.execFile('vagrant', [
    'halt'
  ], {
    cwd: __dirname
  }, function (error, stdout) {
    var containerId = (stdout || '').trim()

    callback(error, containerId)
  })
}
