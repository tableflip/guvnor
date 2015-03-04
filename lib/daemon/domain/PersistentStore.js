var Autowire = require('wantsit').Autowire
var async = require('async')
var util = require('util')
var Store = require('./Store')

var PersistentStore = function (factoryName, fileName) {
  Store.call(this, factoryName)

  this._file = fileName

  this._fs = Autowire
  this._jsonfile = Autowire
  this._logger = Autowire
  this._config = Autowire
  this._fileSystem = Autowire
}
util.inherits(PersistentStore, Store)

PersistentStore.prototype.afterPropertiesSet = function (done) {
  this._file = this._fileSystem.getConfDir() + '/' + this._file

  this._jsonfile.readFile(this._file, function (error, array) {
    if (
    error &&
      // means someone did cat /dev/null > users.json
      error.type !== 'unexpected_eos' &&
      // the file did not exist
      error.code !== 'ENOENT'
    ) {
      return done(error)
    }

    if (!array) {
      return done()
    }

    async.parallel(array.map(function (details) {
      return function (callback) {
        this.create([details], callback)
      }.bind(this)
    }.bind(this)), done)
  }.bind(this))
}

PersistentStore.prototype.save = function (callback) {
  var tasks = []

  this._store.forEach(function (entry) {
    tasks.push(function (callback) {
      if (typeof entry.toSimpleObject === 'function') {
        entry.toSimpleObject(callback)
      } else {
        callback(undefined, entry)
      }
    })
  })

  async.parallel(tasks, function (error, result) {
    if (error) {
      return callback(error)
    }

    this._jsonfile.writeFile(this._file, result, {
      mode: parseInt('0600', 8)
    }, callback)
  }.bind(this))
}

module.exports = PersistentStore
