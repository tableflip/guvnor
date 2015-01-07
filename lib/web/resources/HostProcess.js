var Autowire = require('wantsit').Autowire

var HostProcess = function() {
  this._hostList = Autowire
}

HostProcess.prototype.retrieve = function(request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if(host) {
    var process = host.findProcessById(request.params.processId)

    if(process) {
      reply(process)
    } else {
      reply('No process found for id ' + request.params.processId).code(404)
    }
  } else {
    reply('No host found for name ' + request.params.hostId).code(404)
  }
}

HostProcess.prototype.retrieveAll = function(request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if(host) {
    reply(host.processes)
  } else {
    reply('No host found for name ' + request.params.hostId).code(404)
  }
}

module.exports = HostProcess
