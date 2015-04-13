var Autowire = require('wantsit').Autowire
var EventEmitter = require('events').EventEmitter
var util = require('util')

var Store = function (factoryName) {
  EventEmitter.call(this)

  this._store = []
  this._factory = Autowire({
    name: factoryName
  })
}
util.inherits(Store, EventEmitter)

Store.prototype.all = function () {
  return this._store
}

Store.prototype.create = function (args, callback) {
  this._factory.create(args, function (error, entity) {
    if (!error) {
      this._store.push(entity)
    }

    if (callback) {
      callback(error, entity)
    }
  }.bind(this))
}

Store.prototype.find = function (key, value) {
  var search = key.split('.')
  var needle = null

  this._store.forEach(function (entry) {
    var subkey
    var subvalue = entry

    for (var i = 0; i < search.length; i++) {
      subkey = search[i]

      if (!subvalue[subkey]) {
        return
      }

      subvalue = subvalue[subkey]
    }

    if (subvalue === value) {
      needle = entry
    }
  })

  return needle
}

Store.prototype.findOrCreate = function (key, value, args, callback) {
  var entity = this.find(key, value)

  if (entity) {
    process.nextTick(callback.bind(null, undefined, entity))
  } else {
    this.create(args, callback)
  }
}

Store.prototype.remove = function (key, value) {
  var search = key.split('.')

  for (var i = 0; i < this._store.length; i++) {
    if (this._findValue(search, this._store[i]) === value) {
      this._store.splice(i, 1)
      i--
    }
  }
}

Store.prototype.removeAll = function () {
  this._store = []
}

Store.prototype.intersect = function (key, things) {
  var search = key.split('.')

  for (var i = 0; i < this._store.length; i++) {
    if (!things.some(function (thing) {
      return this._matches(search, thing, this._store[i])
    }.bind(this))) {
      this._store.splice(i, 1)
      i--
    }
  }
}

Store.prototype._matches = function (key, a, b) {
  return this._findValue(key, a) === this._findValue(key, b)
}

Store.prototype._findValue = function (key, thing) {
  if (!Array.isArray(key)) {
    key = key.split('.')
  }

  var value = thing

  for (var i = 0; i < key.length; i++) {
    if (key[i] in value) {
      value = value[key[i]]
    } else {
      return null
    }
  }

  return value
}

module.exports = Store
