var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var it = require('mocha').it
var expect = require('chai').expect
var runCli = require('../../platform/run-cli')
var createApi = require('../../../lib/local/api')
var Wreck = require('wreck')
var https = require('https')
var pem = require('pem')

var GUVNOR_URL = 'https://localhost:30028'

describe('vagrant/auth', function () {
  this.timeout(600000)

  it('should 401 a user without credentials', function (done) {
    var wreck = Wreck.defaults({
      baseUrl: GUVNOR_URL,
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
    wreck.get('/processes', function (error, result) {
      expect(error).to.not.exist
      expect(result.statusCode).to.equal(401)

      done()
    })
  })

  it('should 401 a user with invalid credentials', function (done) {
    pem.createCertificate({}, function (error, results) {
      expect(error).to.not.exist

      var wreck = Wreck.defaults({
        baseUrl: GUVNOR_URL,
        agent: new https.Agent({
          rejectUnauthorized: false,
          cert: results.certificate,
          key: results.clientKey
        })
      })
      wreck.get('/processes', function (error, result) {
        expect(error).to.not.exist
        expect(result.statusCode).to.equal(401)

        done()
      })
    })
  })
})
