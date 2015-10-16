var async = require('async')
var runCommand = require('./run-command')
var config = require('../../daemon/config')
var listAppRefs = require('./list-app-refs')

module.exports = function currentAppRef (appDir, callback) {
  async.parallel({
    ref: runCommand.bind(null, config.GIT_PATH, ['rev-parse', 'HEAD'], appDir, 'Installing app dependencies failed'),
    refs: listAppRefs.bind(null, appDir, callback)
  }, function (error, result) {
    if (error) {
      return callback(error)
    }

    var currentRef

    result.refs.some(function (ref) {
      if (ref.commit === result.ref) {
        currentRef = ref.name

        return true
      }
    })

    callback(error, currentRef)
  })
}
