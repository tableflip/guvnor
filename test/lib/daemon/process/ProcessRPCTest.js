var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  ProcessRPC = require('../../../../lib/daemon/process/ProcessRPC')

describe('ProcessRPC', function () {

  var processRpc, server

  beforeEach(function () {
    processRpc = new ProcessRPC()
    processRpc._userInfo = {
      getUid: sinon.stub(),
      getGid: sinon.stub()
    }
    processRpc._fileSystem = {
      findOrCreateProcessDirectory: sinon.stub()
    }
    processRpc._parentProcess = {
      send: sinon.stub()
    }
    processRpc._dnode = sinon.stub()
    processRpc._fs = {
      chown: sinon.stub(),
      chmod: sinon.stub(),
      unlink: sinon.stub()
    }
    processRpc._heapdump = {
      writeSnapshot: sinon.stub()
    }
    processRpc._config = {
      guvnor: {}
    }
    processRpc._usage = {
      lookup: sinon.stub()
    }
    processRpc._process = {
      exit: sinon.stub(),
      emit: sinon.stub()
    }

    server = {
      listen: sinon.stub()
    }

    processRpc._dnode.returns(server)
  })

  it('should start a kill switch', function (done) {
    var processDirectory = 'foo bar baz'

    processRpc._config.guvnor.rundir = processDirectory
    processRpc._fs.chown.callsArg(3)
    processRpc._fs.chmod.callsArg(2)
    processRpc._dnode.returns(server)
    server.listen.callsArg(1)

    processRpc.startDnodeServer(function () {
      // should have started a server
      expect(server.listen.callCount).to.equal(1)
      expect(server.listen.getCall(0).args[0]).to.equal(processDirectory + '/processes/' + process.pid)

      done()
    })
  })

  it('should provide a method to kill the process', function (done) {
    processRpc._fileSystem.findOrCreateProcessDirectory.callsArgWith(0, null, 'foo')
    processRpc._fs.chown.callsArg(3)
    processRpc._fs.chmod.callsArg(2)
    processRpc._dnode.returns(server)
    server.listen.callsArg(1)

    processRpc.startDnodeServer(function () {
      expect(processRpc._dnode.callCount).to.equal(1)
      expect(processRpc._dnode.getCall(0).args[0].kill).to.be.ok

      done()
    })
  })

  it('should allow sending an event to the process', function () {
    processRpc.send('event:one')

    expect(processRpc._process.emit.withArgs('event:one').called).to.be.true
  })

  it('should allow sending an event to the process with arguments', function () {
    processRpc.send('event:two', 'foo', 'bar')

    expect(processRpc._process.emit.withArgs('event:two', 'foo', 'bar').called).to.be.true
  })

  it('should send an event and invoke a callback', function (done) {
    processRpc.send('foo', 'bar', 'baz', done)
  })

  it('should dump heap', function (done) {
    var name = 'foo'
    processRpc._heapdump.writeSnapshot.callsArgWith(0, undefined, name)

    processRpc.dumpHeap(function (error, fileName) {
      expect(error).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:heapdump:start')).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:heapdump:complete')).to.be.true
      expect(fileName).to.contain(name)

      done()
    })
  })

  it('should dump heap with no callback', function () {
    var name = 'foo'
    processRpc._heapdump.writeSnapshot.callsArgWith(0, undefined, name)

    processRpc.dumpHeap()

    expect(processRpc._parentProcess.send.calledWith('process:heapdump:start')).to.be.true
    expect(processRpc._parentProcess.send.calledWith('process:heapdump:complete')).to.be.true
  })

  it('should inform of dump heap error', function (done) {
    processRpc._heapdump.writeSnapshot.callsArgWith(0, new Error('urk!'))

    processRpc.dumpHeap(function (error, fileName) {
      expect(fileName).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:heapdump:start')).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:heapdump:error')).to.be.true

      done()
    })
  })

  it('should force gc', function (done) {
    global.gc = sinon.stub()

    processRpc.forceGc(function (error) {
      expect(error).to.not.exist

      expect(global.gc.called).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:gc:start')).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:gc:complete')).to.be.true

      done()
    })
  })

  it('should survive forcing gc when gc is not exposed', function (done) {
    global.gc = undefined

    processRpc.forceGc(function (error) {
      expect(error).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:gc:start')).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:gc:complete')).to.be.true

      done()
    })
  })

  it('should force gc with no callback', function () {
    global.gc = sinon.stub()

    processRpc.forceGc()

    expect(global.gc.called).to.be.true
    expect(processRpc._parentProcess.send.calledWith('process:gc:start')).to.be.true
    expect(processRpc._parentProcess.send.calledWith('process:gc:complete')).to.be.true
  })

  it('should delegate to parent to write to stdin', function (done) {
    var string = 'hello'

    processRpc.write(string, function (error) {
      expect(error).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:stdin:write', string)).to.be.true

      done()
    })
  })

  it('should delegate to parent to write to stdin with no callback', function () {
    var string = 'hello'

    processRpc.write(string)

    expect(processRpc._parentProcess.send.calledWith('process:stdin:write', string)).to.be.true
  })

  it('should delegate to parent to signal', function (done) {
    var signal = 'hello'

    processRpc.signal(signal, function (error) {
      expect(error).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:signal', signal)).to.be.true

      done()
    })
  })

  it('should delegate to parent to signal with no callback', function () {
    var signal = 'hello'

    processRpc.signal(signal)

    expect(processRpc._parentProcess.send.calledWith('process:signal', signal)).to.be.true
  })

  it('should propagate usage error when reporting status', function (done) {
    var error = new Error('Urk!')

    processRpc._usage.lookup.callsArgWith(2, error)

    processRpc.reportStatus(function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should inform parent of restart', function (done) {
    processRpc.socket = 'socket'
    processRpc._fs.unlink.withArgs(processRpc.socket).callsArg(1)

    processRpc.restart(function (error) {
      expect(error).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:restarting')).to.be.true

      process.nextTick(function() {
        expect(processRpc._process.exit.withArgs(0).called).to.be.true

        done()
      })
    })
  })

  it('should exit with non-zero code if removing socket fails', function (done) {
    var error = new Error('Urk!')
    processRpc.socket = 'socket'
    processRpc._fs.unlink.withArgs(processRpc.socket).callsArgWith(1, error)

    processRpc.restart(function (er) {
      expect(er).to.equal(error)

      expect(processRpc._parentProcess.send.calledWith('process:restarting')).to.be.true

      process.nextTick(function() {
        expect(processRpc._process.exit.withArgs(1).called).to.be.true

        done()
      })
    })
  })

  it('should inform parent of restart with no callback', function (done) {
    processRpc.socket = 'socket'
    processRpc._fs.unlink.withArgs(processRpc.socket).callsArgWith(1)

    processRpc.restart()

    expect(processRpc._parentProcess.send.calledWith('process:restarting')).to.be.true

    process.nextTick(function() {
      expect(processRpc._process.exit.withArgs(0).called).to.be.true

      done()
    })
  })

  it('should inform parent of stopping', function (done) {
    processRpc.socket = 'socket'
    processRpc._fs.unlink.withArgs(processRpc.socket).callsArg(1)

    processRpc.kill(function (error) {
      expect(error).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:stopping')).to.be.true

      process.nextTick(function() {
        expect(processRpc._process.exit.withArgs(0).called).to.be.true

        done()
      })
    })
  })

  it('should exit with non-zero code if removing socket fails when stopping', function (done) {
    var error = new Error('Urk!')
    processRpc.socket = 'socket'
    processRpc._fs.unlink.withArgs(processRpc.socket).callsArgWith(1, error)

    processRpc.kill(function (er) {
      expect(er).to.equal(error)

      expect(processRpc._parentProcess.send.calledWith('process:stopping')).to.be.true

      process.nextTick(function() {
        expect(processRpc._process.exit.withArgs(1).called).to.be.true

        done()
      })
    })
  })

  it('should inform parent of stopping with no callback', function (done) {
    processRpc.socket = 'socket'
    processRpc._fs.unlink.withArgs(processRpc.socket).callsArgWith(1)

    processRpc.kill()

    expect(processRpc._parentProcess.send.calledWith('process:stopping')).to.be.true

    process.nextTick(function() {
      expect(processRpc._process.exit.withArgs(0).called).to.be.true

      done()
    })
  })
})
