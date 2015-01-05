var expect = require('chai').expect,
  sinon = require('sinon'),
  CommandLine = require('../../../../lib/daemon/util/CommandLine')

describe('CommandLine', function() {
  var cl

  beforeEach(function() {
    cl = new CommandLine()
    cl._child_process = {
      exec: sinon.stub()
    }
  })

  it('should find a command', function(done) {
    var path = '/usr/local/bin/foo'

    cl._child_process.exec.withArgs('which foo', sinon.match.func).callsArgWith(1, undefined, path)

    cl._find('foo', function(error) {
      expect(error).to.not.exist
      expect(cl._foo).to.equal(path)

      done()
    })
  })

  it('should fail to find a command', function(done) {
    cl._child_process.exec.withArgs('which foo', sinon.match.func).callsArgWith(1, new Error('child process failed'))

    cl._find('foo', function(error) {
      expect(error).to.be.ok
      expect(cl._foo).to.not.exist

      done()
    })
  })
})
