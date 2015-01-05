var crypto = require('crypto')

var Crypto = function() {

}

Crypto.prototype.sign = function(principal, secret, callback) {
  crypto.randomBytes(32, function(error, bytes) {
    if(error) return callback(error)

    var nonce = bytes.toString('base64')
    var date = Date.now()

    callback(undefined, {
      principal: principal,
      date: date,
      nonce: nonce,
      hash: this._hash(date + secret + nonce)
    })
  }.bind(this))
}

Crypto.prototype.verify = function(signature, secret) {
  return signature.hash == this._hash(signature.date + secret + signature.nonce)
}

Crypto.prototype._hash = function(date, nonce, secret) {
  var shasum = crypto.createHash('sha1')
  shasum.update(date + secret + nonce)
  return shasum.digest('base64')
}

Crypto.prototype.generateSecret = function(callback) {
  crypto.randomBytes(32, function(error, bytes) {
    callback(error, bytes ? bytes.toString('base64') : undefined)
  })
}

module.exports = Crypto
