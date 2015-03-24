var Autowire = require('wantsit').Autowire
var Stream = require('stream')
var path = require('path')

var HostProcessHeapDump = function () {
  this._hostList = Autowire
  this._logger = Autowire
}

HostProcessHeapDump.prototype.retrieveAll = function (request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if (!host) {
    return reply('No host found for name ' + request.params.hostId).code(404)
  }

  var proc = host.findProcessById(request.params.processId)

  if (!proc) {
    return reply('No process found for id ' + request.params.processId).code(404)
  }

  reply(proc.snapshots)
}

HostProcessHeapDump.prototype.retrieve = function (request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if (!host) {
    return reply('No host found for name ' + request.params.hostId).code(404)
  }

  host.findProcessInfoById(request.params.processId, function (error, managedProcess) {
    if (error || !managedProcess) {
      return reply('No process found for id ' + request.params.processId).code(404)
    }

    var stream = new Stream.Readable()
    stream._read = function () {
      // do nothing because we don't control this stream!
    }

    managedProcess.fetchHeapSnapshot(request.params.snapshotId, function (data) {
      stream.push(data, 'base64')
    }, function () {
      stream.emit('end')
      managedProcess.disconnect()
    }, function (error, heapSnapshot) {
      if (error) {
        return reply('No snapshot found for id ' + request.params.snapshotId).code(404)
      }

      reply(stream)
        .type('application/octet-stream')
        .header('Content-Disposition', 'attachment; filename="' + path.basename(heapSnapshot.path) + '"')
        .bytes(heapSnapshot.size)
    })
  })
}

module.exports = HostProcessHeapDump
