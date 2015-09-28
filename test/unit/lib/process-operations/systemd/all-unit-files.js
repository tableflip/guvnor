var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('process-operations/systemd/all-unit-files', function () {
  var fs
  var ini
  var loadUnitFiles

  beforeEach(function () {
    fs = {
      readdir: sinon.stub(),
      readFile: sinon.stub()
    }
    ini = {
      parse: sinon.stub()
    }
    loadUnitFiles = proxyquire('../../../../../lib/process-operations/systemd/all-unit-files', {
      'fs': fs,
      'ini': ini
    })
  })

  it('should load process unit files', function (done) {
    var files = [
      'guvnor.with-cert',
      'guvnor.env.with-cert',
      'guvnor.wthout-cert',
      'some.other.process'
    ]

    fs.readdir.callsArgWithAsync(1, null, files)
    fs.readFile.withArgs('/etc/systemd/system/guvnor.with-cert', 'utf8').callsArgWithAsync(2, null, 'with-cert-contents')
    fs.readFile.withArgs('/etc/systemd/system/guvnor.env.with-cert', 'utf8').callsArgWithAsync(2, null, 'with-cert-env-contents')
    fs.readFile.withArgs('/etc/systemd/system/guvnor.wthout-cert', 'utf8').callsArgWithAsync(2, null, 'without-cert-contents')

    ini.parse.withArgs('with-cert-contents').returns({
      Service: {
        Type: 'simple',
        ExecStart: 'node foo',
        Restart: 'always'
      },
      Unit: {
        Description: 'with-cert-label'
      }
    })
    ini.parse.withArgs('with-cert-env-contents').returns({
      GUVNOR_CERT: 'with-cert-cert'
    })
    ini.parse.withArgs('without-cert-contents').returns({
      Service: {
        Type: 'simple',
        ExecStart: 'node foo',
        Restart: 'always'
      },
      Unit: {
        Description: 'without-cert-label'
      }
    })

    loadUnitFiles(function (error, result) {
      expect(error).to.not.exist
      expect(Object.keys(result).length).to.equal(2)
      expect(result[0].Unit.Description).to.equal('with-cert-label')
      expect(result[0].env.GUVNOR_CERT).to.equal('with-cert-cert')
      expect(result[1].Unit.Description).to.equal('without-cert-label')
      expect(result[1].env).to.deep.equal({})

      done()
    })
  })
})
