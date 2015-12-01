var dnode = require('boss-dnode')
var logger = require('winston')
var config = require('../../../daemon/config')
var path = require('path')

module.exports = function connectToProcess (user, name, callback) {
  var socket = path.join(config.PROCESS_RUN_DIR, name + '.sock')

  logger.debug('Connecting to', socket)
  var d = dnode.connect(socket)
  d.on('error', function (error) {
    callback(error)
    callback = null
  })
  d.on('remote', function (remote) {
    if (!callback) {
      // would have emitted error event
      return
    }

    callback(null, remote, function () {
      d.end()
    })
  })
}
