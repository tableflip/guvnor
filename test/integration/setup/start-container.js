var child_process = require('child_process')
var path = require('path')

module.exports = function startContainer (tag, host, port, callback) {
  child_process.execFile('docker', [
    'run',
    '-p', port + ':8001',
    '--env', 'GUVNOR_HTTPS_HOST=' + host,
    '--detach',
    tag
  ], {
    cwd: path.resolve(__dirname, '../../../')
  }, function (error, stdout) {
    var containerId = (stdout || '').trim()

    callback(error, containerId)
  })
}
