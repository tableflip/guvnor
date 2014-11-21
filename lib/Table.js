var colours = require('colors')

var Table = function(emptyMessage) {
  this._rows = []

  this._emptyMessage = emptyMessage
  this._columnLengths = []
}

Table.prototype._calculateLengths = function(data) {
  data.forEach(function(datum, index) {
    var length = ('' + datum).length

    if(!this._columnLengths[index] || length > this._columnLengths[index]) {
      this._columnLengths[index] = length
    }
  }.bind(this))
}

Table.prototype.addHeader = function(data) {
  this._calculateLengths(data)

  this._header = data
}

Table.prototype.addRow = function(data) {
  this._calculateLengths(data)

  this._rows.push(data)
}

Table.prototype.print = function(func) {
  if(this._rows.length == 0) {
    return func(this._emptyMessage.bold)
  }

  if(this._header) {
    var output = ''

    this._header.forEach(function(item, index) {
      output += this._rpad(item, this._columnLengths[index]) + ' '
    }.bind(this))

    func(output.bold)
  }

  this._rows.forEach(function(row) {
    var output = ''

    row.forEach(function(item, index) {
      output += this._rpad(item, this._columnLengths[index]) + ' '
    }.bind(this))

    output += ''

    func(output)
  }.bind(this))
}

Table.prototype._rpad = function(thing, len) {
  if (thing === undefined || thing === null) {
    thing = ''
  } else {
    thing = thing + ''
  }

  while (thing.length < len) {
    thing = thing + ' '
  }

  return thing
}

module.exports = Table
