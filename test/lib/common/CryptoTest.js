var expect = require('chai').expect,
  Crypto = require('../../../lib/common/Crypto')

describe('Crypto', function() {

  it('should produce a signature', function(done) {
    var crypto = new Crypto()

    crypto.generateSecret(function(error, secret) {
      var principal = 'foo'

      crypto.sign(principal, secret, function(error, signature) {
        expect(error).to.not.exist
        expect(signature.principal).to.equal(principal)
        expect(signature.nonce).to.be.ok
        expect(signature.date).to.be.ok
        expect(signature.hash).to.be.ok

        done()
      })
    })
  })

  it('should verify a signature', function(done) {
    var crypto = new Crypto()

    crypto.generateSecret(function(error, secret) {
      var principal = 'foo'

      crypto.sign(principal, secret, function(error, signature) {
        expect(error).to.not.exist

        var result = crypto.verify(signature, secret)

        expect(result).to.be.true

        done()
      })
    })
  })
})
