'use strict'

const operations = require('../../operations')

const watchProcessLogs = (server) => {
  operations.findUserDetails(null, process.getuid())
  .then(user => operations.watchProcessLogs({
    user: user,
    log: server.log.bind(server)
  }))
  .then(() => server)
}

module.exports = watchProcessLogs
