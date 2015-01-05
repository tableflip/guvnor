var Autowire = require('wantsit').Autowire,
  async = require('async'),
  EventEmitter = require('events').EventEmitter,
  util = require('util')

var Store = function(factoryName) {
  EventEmitter.call(this)

  this._store = []
  this._factory = Autowire({
    name: factoryName
  })
}
util.inherits(Store, EventEmitter)

Store.prototype.all = function() {
  return this._store
}

Store.prototype.create = function(args, callback) {
  this._factory.create(args, function(error, entity) {
    if(!error) {
      this._store.push(entity)
    }

    if(callback) {
      callback(error, entity)
    }
  }.bind(this))
}

Store.prototype.find = function(key, value) {
  var search = key.split('.')
  var needle

  this._store.forEach(function(entry) {
    var subkey
    var subvalue = entry

    for(var i = 0; i < search.length; i++) {
      subkey = search[i]

      if(!subvalue[subkey]) {
        return
      }

      subvalue = subvalue[subkey]
    }

    if(subvalue == value) {
      needle = entry
    }
  })

  return needle
}

Store.prototype.remove = function(key, value) {
  var search = key.split('.')

  for(var i = 0; i < this._store.length; i++) {
    if(this._shouldRemove(search, value, this._store[i])) {
      this._store.splice(i, 1)
      i--
    }
  }
}

Store.prototype._shouldRemove = function(search, value, entry) {
  var subvalue = entry

  for(var i = 0; i < search.length; i++) {
    if(!subvalue[search[i]]) {
      return false
    }

    subvalue = subvalue[search[i]]
  }

  return subvalue == value
}

module.exports = Store
