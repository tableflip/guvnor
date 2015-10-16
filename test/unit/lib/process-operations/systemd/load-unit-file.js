var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')
var config = require('../../../../../lib/process-operations/systemd/config')

describe('process-operations/systemd/load-unit-file', function () {
  var fs
  var ini
  var loadUnitFiles

  beforeEach(function () {
    fs = {
      readFile: sinon.stub()
    }
    loadUnitFile = proxyquire('../../../../../lib/process-operations/systemd/load-unit-file', {
      'fs': fs
    })
  })

  it('should load process unit files', function (done) {
    var name = 'with-cert'

    var files = {}
    files[config.UNIT_FILE_LOCATIONS + '/guvnor.' + name + '.service'] = '[Unit]\nDescription=with-cert'
    files[config.UNIT_FILE_LOCATIONS + '/guvnor.' + name + '.env'] = 'GUVNOR_NAME=with-cert'
    files[config.UNIT_FILE_LOCATIONS + '/guvnor.' + name + '.key'] = 'ssl-key'
    files[config.UNIT_FILE_LOCATIONS + '/guvnor.' + name + '.cert'] = 'ssl-cert'
    files[config.UNIT_FILE_LOCATIONS + '/guvnor.' + name + '.ca'] = 'ssl-ca'
    files[config.UNIT_FILE_LOCATIONS + '/some.other.process.service'] = '[Unit]\nDescription=not interested'

    Object.keys(files).forEach(function (key) {
      fs.readFile.withArgs(key, 'utf8').callsArgWithAsync(2, null, files[key])
    })

    loadUnitFile(name, function (error, proc) {
      expect(error).to.not.exist

      expect(proc.Unit.Description).to.equal(name)
      expect(proc.env.GUVNOR_KEY).to.equal('ssl-key')
      expect(proc.env.GUVNOR_CERT).to.equal('ssl-cert')
      expect(proc.env.GUVNOR_CA).to.equal('ssl-ca')

      done()
    })
  })
})
