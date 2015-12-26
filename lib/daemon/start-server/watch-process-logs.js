var operations = require('../../operations')

module.exports = function watchProcessLogs (server, callback) {
  operations.findUserDetails(null, process.getuid(), function (error, user) {
    if (error) {
      return callback(error)
    }

    operations.watchProcessLogs({
      user: user,
      log: server.log.bind(server)
    }, function (error) {
      callback(error, server)
    })
  })
}
