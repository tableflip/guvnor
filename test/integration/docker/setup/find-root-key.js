var child_process = require('child_process')

module.exports = function (containerId, callback) {
  child_process.execFile('docker', [
    'exec',
    containerId,
    'cat', '/root/.config/guvnor/root.keys'
  ], function (error, stdout) {
    stdout = stdout || ''

    callback(error, stdout.trim())
  })
}
