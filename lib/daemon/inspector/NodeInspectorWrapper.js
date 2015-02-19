var Autowire = require('wantsit').Autowire,
  path = require('path')

var NodeInspectorWrapper = function() {
  this._config = Autowire
  this._logger = Autowire
  this._child_process = Autowire

  this._restarting = false
  this.debuggerPort = 0
}

NodeInspectorWrapper.prototype.afterPropertiesSet = function(done) {
  if(!this._config.remote.inspector.enabled) {
    return done()
  }

  process.on('exit', this.stopNodeInspector.bind(this))
  process.on('SIGINT', this.stopNodeInspector.bind(this))

  this._startNodeInspector(done)
}

NodeInspectorWrapper.prototype._startNodeInspector = function(done) {
  this._restarting = false

  this._logger.info('starting node-inspector')

  // node-inspector sometimes lets exceptions bubble up so start it in a separate
  // process so it can't take the main daemon down.
  this._child = this._child_process.fork(
    path.resolve(__dirname),
    [], {
      execArgv: [],
      env: {
        GUVNOR_NODE_INSPECTOR_PORT: this._config.remote.inspector.port,
        GUVNOR_NODE_INSPECTOR_HOST: this._config.remote.inspector.host
      }
    })
  this._child.on('message', function(message) {
    if(message.type == 'node-inspector:ready') {
      this._logger.info('node-inspector online')

      this.debuggerPort = parseInt(message.args[0], 10)
      done()
      done = null
    } else if(message.type == 'node-inspector:failed') {
      this._logger.warn('node-inspector failed to start with ', message.args[0].stack)

      var error = new Error(message.args[0].message)
      error.stack = message.args[0].stack

      done(error)
      done = null
    }
  }.bind(this))
  this._child.on('error', function(error) {
    this._logger.warn('node-inspector crashed with', error.stack)

    if(done) {
      done(error)
      done = null
      return
    }

    if(!this._restarting) {
      this._restarting = true

      process.nextTick(this._startNodeInspector.bind(this))
    }
  }.bind(this))
  this._child.on('exit', function(code) {
    this._logger.warn('node-inspector exited with code %d', code)

    if(done) {
      done(new Error('node-inspector exited with code ' + code))
      done = null
      return
    }

    if(!this._restarting) {
      this._restarting = true

      process.nextTick(this._startNodeInspector.bind(this))
    }
  }.bind(this))
}

NodeInspectorWrapper.prototype.stopNodeInspector = function() {
  if(!this._child) {
    return
  }

  this._child.removeAllListeners('error')
  this._child.removeAllListeners('exit')
  this._child.kill()

  delete this._child
}

module.exports = NodeInspectorWrapper
