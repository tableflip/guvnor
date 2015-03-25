var Autowire = require('wantsit').Autowire

var HostApp = function () {
  this._hostList = Autowire
}

HostApp.prototype.retrieve = function (request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if (host) {
    var process = host.findUserByName(request.params.processId)

    if (process) {
      reply(process)
    } else {
      reply('No app found for name ' + request.params.appId).code(404)
    }
  } else {
    reply('No host found for name ' + request.params.hostId).code(404)
  }
}

HostApp.prototype.retrieveAll = function (request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if (host) {
    host.findUsers(function (error, users) {
      if (error) {
        reply(error)

        return
      }

      reply(users)
    })
  } else {
    reply('No host found for name ' + request.params.hostId).code(404)
  }
}

module.exports = HostApp
