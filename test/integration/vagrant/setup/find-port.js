var child_process = require('child_process')

module.exports = function findPort (callback) {
  child_process.execFile('vagrant', [
    'port', '8001'
  ], {
    cwd: __dirname
  }, function (error, stdout) {
    callback(error, Number((stdout || '').trim()))
  })
}
