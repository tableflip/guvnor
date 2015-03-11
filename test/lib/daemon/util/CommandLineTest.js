var expect = require('chai').expect,
  sinon = require('sinon'),
  CommandLine = require('../../../../lib/daemon/util/CommandLine')

describe('CommandLine', function () {
  var cl

  beforeEach(function () {
    cl = new CommandLine()
    cl._child_process = {
      exec: sinon.stub()
    }
  })

  it('should find a command', function (done) {
    var path = '/usr/local/bin/foo'

    cl._child_process.exec.callsArgWith(2, undefined, path)

    cl._find('foo', {}, function (error, found) {
      expect(error).to.not.exist
      expect(found).to.equal(path)

      done()
    })
  })

  it('should fail to find a command', function (done) {
    cl._child_process.exec.callsArgWith(2, new Error('child process failed'))

    cl._find('foo', {}, function (error, found) {
      expect(error).to.be.ok
      expect(found).to.not.exist

      done()
    })
  })
})
