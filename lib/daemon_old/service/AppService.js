var Autowire = require('wantsit').Autowire
var EventEmitter = require('wildemitter')
var util = require('util')
var async = require('async')

var AppService = function () {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._config = Autowire
  this._applicationStore = Autowire
  this._processService = Autowire
}
util.inherits(AppService, EventEmitter)

AppService.prototype.findByName = function (name) {
  return this._applicationStore.find('name', name)
}

AppService.prototype.findById = function (id) {
  return this._applicationStore.find('id', id)
}

AppService.prototype.deploy = function (name, url, user, onOut, onErr, callback) {
  if (this._applicationStore.find('name', name)) {
    return callback(new Error('An app with name ' + name + ' already exists'))
  }

  this._applicationStore.create([{
    name: name,
    url: url,
    user: user
  }], function (error, appInfo) {
    if (error) {
      return callback(error)
    }

    appInfo.clone(onOut, onErr, function (error) {
      if (error) {
        this._applicationStore.remove('id', appInfo.id)

        // something went wrong, remove the cloned repo if it exists
        return appInfo.remove(callback.bind(null, error))
      }

      this._applicationStore.save(function (error) {
        this.emit('app:installed', appInfo)

        callback(error, appInfo)
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

AppService.prototype.remove = function (name, callback) {
  this._withApp(name, function (error, appInfo) {
    if (error) {
      return callback(error)
    }

    // if the app we are about to remove is running, abort
    if (this._processService.listProcesses().filter(function (proc) {
        return proc.app === appInfo.id && proc.running
      }).length > 0) {
      return callback(new Error('App ' + name + ' is running, please stop it first.'))
    }

    appInfo.remove(function (error) {
      if (error) {
        return callback(error)
      }

      this._applicationStore.remove('id', appInfo.id)
      this._applicationStore.save(function (error) {
        this.emit('app:removed', appInfo)

        callback(error)
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

AppService.prototype.list = function (callback) {
  callback(undefined, this._applicationStore.all())
}

AppService.prototype.switchRef = function (name, ref, onOut, onErr, callback) {
  this._withApp(name, function (error, appInfo) {
    if (error) {
      return callback(error)
    }

    // if the app we are about to remove is running, abort
    if (this._processService.listProcesses().filter(function (proc) {
        return proc.app === appInfo.id && proc.running
      }).length > 0) {
      return callback(new Error('App ' + name + ' is running, please stop it first.'))
    }

    async.series([
      appInfo.currentRef.bind(appInfo),
      appInfo.checkout.bind(appInfo, ref, onOut, onErr),
      appInfo.currentRef.bind(appInfo)
    ], function (error, results) {
      if (!error) {
        this.emit('app:refs:switched', appInfo, results[0][0], results[2][0])
      }

      callback(error, appInfo, results[0], results[2])
    }.bind(this))
  }.bind(this))
}

AppService.prototype.listRefs = function (name, callback) {
  this._withApp(name, function (error, appInfo) {
    if (error) {
      return callback(error)
    }

    appInfo.listRefs(callback)
  })
}

AppService.prototype.updateRefs = function (name, onOut, onError, callback) {
  this._withApp(name, function (error, appInfo) {
    if (error) {
      return callback(error)
    }

    // if the app we are about to remove is running, abort
    if (this._processService.listProcesses().filter(function (proc) {
        return proc.app === appInfo.id && proc.running
      }).length > 0) {
      return callback(new Error('App ' + name + ' is running, please stop it first.'))
    }

    appInfo.updateRefs(onOut, onError, function (error, appInfo, refs) {
      this.emit('app:refs:updated', error, appInfo, refs)

      callback(error, appInfo, refs)
    }.bind(this))
  }.bind(this))
}

AppService.prototype.currentRef = function (name, callback) {
  this._withApp(name, function (error, appInfo) {
    if (error) {
      return callback(error)
    }

    appInfo.currentRef(callback)
  })
}

AppService.prototype._withApp = function (name, callback) {
  var appInfo = this.findByName(name)

  if (!appInfo) {
    return callback(new Error('No app exists for name ' + name))
  }

  callback(undefined, appInfo)
}

module.exports = AppService
