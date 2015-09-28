var async = require('async')
var path = require('path')
var child_process = require('child_process')

module.exports = function rootApi (containerId, callback) {
  async.waterfall([
    function findRootKey(next) {
      child_process.execFile('docker', [
        'exec',
        containerId,
        'cat', '/root/.config/guvnor/root.keys'
      ], {
        cwd: path.resolve(__dirname, '../../../')
      }, function (error, stdout) {
        var keyBundle = (stdout = stdout || '').trim()

        next(error, keyBundle)
      })
    },
    function parseRootKey (keyBundle, next) {
      try {
        next(null, JSON.parse(keyBundle))
      } catch (e) {
        next(e)
      }
    }
  ], callback)
}
