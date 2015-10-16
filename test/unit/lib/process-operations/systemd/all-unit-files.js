var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('process-operations/systemd/all-unit-files', function () {
  var fs
  var loadUnitFile
  var loadUnitFiles

  beforeEach(function () {
    fs = {
      readdir: sinon.stub(),
      readFile: sinon.stub()
    }
    loadUnitFile = sinon.stub()
    loadUnitFiles = proxyquire('../../../../../lib/process-operations/systemd/all-unit-files', {
      'fs': fs,
      './load-unit-file': loadUnitFile
    })
  })

  it('should load process unit files', function (done) {
    var files = [
      'guvnor.with-cert.service',
      'guvnor.with-cert.env',
      'some.other.process.service'
    ]

    fs.readdir.callsArgWithAsync(1, null, files)

    loadUnitFile.withArgs('with-cert').callsArgWithAsync(1, null, {
      Service: {
        Type: 'simple',
        ExecStart: 'node foo',
        Restart: 'always'
      },
      Unit: {
        Description: 'with-cert-label'
      },
      env: {
        GUVNOR_CERT: 'with-cert-cert',
        GUVNOR_KEY: 'with-cert-key',
        GUVNOR_CA: 'with-cert-ca',
      }
    })

    loadUnitFiles(function (error, result) {
      expect(error).to.not.exist
      expect(result.length).to.equal(1)
      expect(result[0].Unit.Description).to.equal('with-cert-label')
      expect(result[0].env.GUVNOR_CERT).to.equal('with-cert-cert')

      done()
    })
  })
})
