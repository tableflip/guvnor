var util = require('util')
var PersistentStore = require('./PersistentStore')
var path = require('path')

var PersistentProcessInfoStore = function (factoryName, fileName) {
  PersistentStore.call(this, factoryName)
}
util.inherits(PersistentProcessInfoStore, PersistentStore)

PersistentProcessInfoStore.prototype.save = function (callback) {
  this._jsonfile.writeFile(this._file, this._store.map(this._removeRuntimeProperties.bind(this)), {
    mode: parseInt('0600', 8)
  }, callback)
}

PersistentProcessInfoStore.prototype.saveSync = function () {
  this._jsonfile.writeFileSync(this._file, this._store.map(this._removeRuntimeProperties.bind(this)), {
    mode: parseInt('0600', 8)
  })
}

PersistentProcessInfoStore.prototype._removeRuntimeProperties = function (processInfo) {
  var output = processInfo.toJSON()

  delete output.id
  delete output.pid
  delete output.debugPort
  delete output.restarts
  delete output.totalRestarts
  delete output.status
  delete output.socket
  delete output.manager

  if (!output.debug) {
    delete output.debug
  }

  if (!processInfo.cluster) {
    delete output.instances
  }

  delete output.cluster

  if (path.dirname(output.script) === output.cwd) {
    delete output.cwd
  }

  if (output.argv.length === 0) {
    delete output.argv
  }

  if (output.execArgv.length === 0) {
    delete output.execArgv
  }

  if (output.restartOnError) {
    delete output.restartOnError
  }

  if (output.restartRetries === 5) {
    delete output.restartRetries
  }

  if (output.name === path.basename(output.script)) {
    delete output.name
  }

  return output
}

module.exports = PersistentProcessInfoStore
