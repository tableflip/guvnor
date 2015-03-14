var expect = require('chai').expect,
  sinon = require('sinon'),
  CommandLine = require('../../../../lib/daemon/util/CommandLine')

describe('CommandLine', function () {
  var cl

  beforeEach(function () {
    cl = new CommandLine()
    cl._child_process = {
      exec: sinon.stub(),
      spawn: sinon.stub()
    }
    cl._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
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
    cl._child_process.exec.withArgs(sinon.match.string, sinon.match.object, sinon.match.func).callsArgWith(2, new Error('child process failed'))
    cl._child_process.exec.withArgs(sinon.match.string, sinon.match.func).callsArgWith(1, new Error('child process still failed'))

    cl._find('foo', {}, function (error, found) {
      expect(error).to.be.ok
      expect(found).to.not.exist

      done()
    })
  })

  it('should execute a git command', function (done) {
    var git = 'git'
    var exitCode = 0
    var proc = {
      stdout: {
        on: sinon.stub(),
        removeAllListeners: sinon.stub()
      },
      stderr: {
        on: sinon.stub(),
        removeAllListeners: sinon.stub()
      },
      once: sinon.stub()
    }
    cl._child_process.spawn.withArgs(git).returns(proc)

    cl._find = sinon.stub().withArgs('git').callsArgWith(2, undefined, git)

    var args = ['foo', 'bar']
    var path = ''
    var userDetails = {}
    var onOut = sinon.stub()
    var onErr = sinon.stub()
    var message = 'message'

    cl.git(args, path, userDetails, onOut, onErr, message, function (error) {
      expect(error).to.not.exist
      expect(proc.stdout.removeAllListeners.calledWith('data')).to.be.true
      expect(proc.stderr.removeAllListeners.calledWith('data')).to.be.true
      expect(onOut.calledWith('baz')).to.be.true
      expect(onErr.calledWith('qux')).to.be.true

      done()
    })

    expect(proc.stdout.on.getCall(0).args[0]).to.equal('data')
    proc.stdout.on.getCall(0).args[1]('baz')

    expect(proc.stderr.on.getCall(0).args[0]).to.equal('data')
    proc.stderr.on.getCall(0).args[1]('qux')

    expect(proc.once.getCall(0).args[0]).to.equal('close')
    proc.once.getCall(0).args[1](exitCode)
  })

  it('should propagate error finding git', function (done) {
    var git = 'git'
    var error = new Error('Urk!')

    cl._find = sinon.stub().withArgs('git').callsArgWith(2, error)

    var args = ['foo', 'bar']
    var path = ''
    var userDetails = {}
    var onOut = sinon.stub()
    var onErr = sinon.stub()
    var message = 'message'

    cl.git(args, path, userDetails, onOut, onErr, message, function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should execute an npm command', function (done) {
    var npm = 'npm'
    var exitCode = 0
    var proc = {
      stdout: {
        on: sinon.stub(),
        removeAllListeners: sinon.stub()
      },
      stderr: {
        on: sinon.stub(),
        removeAllListeners: sinon.stub()
      },
      once: sinon.stub()
    }
    cl._child_process.spawn.withArgs(npm).returns(proc)

    cl._find = sinon.stub().withArgs('npm').callsArgWith(2, undefined, npm)

    var args = ['foo', 'bar']
    var path = ''
    var userDetails = {}
    var onOut = sinon.stub()
    var onErr = sinon.stub()
    var message = 'message'

    cl.npm(args, path, userDetails, onOut, onErr, message, function (error) {
      expect(error).to.not.exist
      expect(proc.stdout.removeAllListeners.calledWith('data')).to.be.true
      expect(proc.stderr.removeAllListeners.calledWith('data')).to.be.true
      expect(onOut.calledWith('baz')).to.be.true
      expect(onErr.calledWith('qux')).to.be.true

      done()
    })

    expect(proc.stdout.on.getCall(0).args[0]).to.equal('data')
    proc.stdout.on.getCall(0).args[1]('baz')

    expect(proc.stderr.on.getCall(0).args[0]).to.equal('data')
    proc.stderr.on.getCall(0).args[1]('qux')

    expect(proc.once.getCall(0).args[0]).to.equal('close')
    proc.once.getCall(0).args[1](exitCode)
  })

  it('should propagate error finding git', function (done) {
    var npm = 'npm'
    var error = new Error('Urk!')

    cl._find = sinon.stub().withArgs('npm').callsArgWith(2, error)

    var args = ['foo', 'bar']
    var path = ''
    var userDetails = {}
    var onOut = sinon.stub()
    var onErr = sinon.stub()
    var message = 'message'

    cl.npm(args, path, userDetails, onOut, onErr, message, function (er) {
      expect(er).to.equal(error)

      done()
    })
  })
})
