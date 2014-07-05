var Autowire = require('wantsit').Autowire,
  MessageHandler = require('../process/MessageHandler'),
  util = require('util')

var ClusterMessageHandler = function() {
  MessageHandler.call(this)

  this._parentProcess = Autowire
  this._usage = Autowire
  this._clusterManager = Autowire
}
util.inherits(ClusterMessageHandler, MessageHandler)

ClusterMessageHandler.prototype.afterPropertiesSet = function() {
  this._parentProcess.on('message', function(event) {
    if(!event || !event.type) {
      return
    }

    if(this[event.type]) {
      this[event.type](event)
    }
  }.bind(this))
}

ClusterMessageHandler.prototype['boss:status'] = function() {
  MessageHandler['boss:status'].call(this)

  this._clusterManager.workers.forEach(function(worker) {
    worker.send('boss:status')
  })
}

ClusterMessageHandler.prototype['boss:numworkers'] = function(event) {
  this._numWorkers = isNaN(event.workers) ? 1 : event.workers

  this._updateWorkers()
}

module.exports = ClusterMessageHandler
