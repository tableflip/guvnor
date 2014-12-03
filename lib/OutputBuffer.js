
var OutputBuffer = function(out) {
  this._out = out
  this._buffer = ''
}

OutputBuffer.prototype.append = function(data) {
  this._buffer += data
  var index = this._buffer.indexOf('\n')

  while(index != -1) {
    var sub = this._buffer.substring(0, index)

    this._out(sub)

    this._buffer = this._buffer.substring(index + 1)
    index = this._buffer.indexOf('\n')
  }
}

OutputBuffer.prototype.flush = function() {
  if(this._buffer) {
    this._out(this._buffer)
  }
}

module.exports = OutputBuffer
