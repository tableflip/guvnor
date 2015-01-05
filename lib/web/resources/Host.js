var Autowire = require('wantsit').Autowire

var Host = function() {
  this._hostList = Autowire
}

Host.prototype.retrieve = function(request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if(host) {
    reply(host)
  } else {
    reply('No host found for name ' + request.params.hostId).code(404)
  }
}

Host.prototype.retrieveAll = function(request, reply) {
  reply(this._hostList.getHosts())
}

module.exports = Host
