var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('process-operations/launchd/all-plists', function () {
  var fs
  var plist
  var loadProcessPlists

  beforeEach(function () {
    fs = {
      readdir: sinon.stub(),
      readFile: sinon.stub()
    }
    plist = {
      parse: sinon.stub()
    }
    loadProcessPlists = proxyquire('../../../../../lib/process-operations/launchd/all-plists', {
      'fs': fs,
      'plist': plist
    })
  })

  it('should load process plists', function (done) {
    var files = [
      'guvnor.with-cert',
      'guvnor.wthout-cert',
      'some.other.process'
    ]

    fs.readdir.callsArgWithAsync(1, null, files)
    fs.readFile.withArgs('/Library/LaunchDaemons/guvnor.with-cert', 'utf8').callsArgWithAsync(2, null, 'with-cert-contents')
    fs.readFile.withArgs('/Library/LaunchDaemons/guvnor.wthout-cert', 'utf8').callsArgWithAsync(2, null, 'without-cert-contents')

    plist.parse.withArgs('with-cert-contents').returns({
      Label: 'with-cert-label',
      EnvironmentVariables: {
        GUVNOR_CERT: 'with-cert-cert'
      }
    })
    plist.parse.withArgs('without-cert-contents').returns({
      Label: 'without-cert-label',
      EnvironmentVariables: {

      }
    })

    loadProcessPlists(function (error, result) {
      expect(error).to.not.exist
      expect(Object.keys(result).length).to.equal(2)
      expect(result[0].Label).to.equal('with-cert-label')
      expect(result[1].Label).to.equal('without-cert-label')

      done()
    })
  })
})
