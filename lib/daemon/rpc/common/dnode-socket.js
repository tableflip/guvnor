
var dnode = require('boss-dnode')
var debug = require('debug')('daemon:rpc:dnode-socket')
var fs = require('fs')
var removeSocket = require('./remove-socket')

module.exports = function startDnodeSocket(umask, path, api, timeout, callback) {
  var oldmask = process.umask(umask)
  var connections = {}

  // publish RPC methods
  var server = dnode(function (client, connection) {
    debug('incoming connection - client:', client, 'id: ', connection.id)

    // store connection
    connections[connection.id] = client

    // make sure we get rid of the connection when the client goes away
    connection.on('end', function (id) {
      delete connections[id]
      debug('client connection', id, 'ended')
    }.bind(null, connection.id))
    connection.on('error', function (id, error) {
      delete connections[id]
      debug('client connection', id, 'erred', error)
    }.bind(null, connection.id))

    connection.stream.on('error', function (id, error) {
      delete connections[id]
      debug('client connection socket', id, 'erred', error)
    }.bind(null, connection.id))

    for (var key in api) {
      this[key] = api[key]
    }
  }, {
    timeout: timeout
  })
  var socket = server.listen({
    path: path
  }, function () {
    process.umask(oldmask)

    // make sure it's owned by the write user/group
    fs.chown(path, process.getuid(), process.getgid(), callback)
  })
  socket.on('error', function (error) {
    debug('Socket error', error)
  })
  server.on('error', function (error) {
    debug('Server error', error)
  })
}
