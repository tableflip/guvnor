var async = require('async')
var plist = require('plist')
var fs = require('fs')

module.exports = function launchdLoadProcessPlist (file, callback) {
  async.waterfall([
    fs.readFile.bind(fs, file, 'utf8'),
    async.asyncify(plist.parse)
  ], callback)
}
