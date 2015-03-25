var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  ProcessRPC = require('../../../../lib/daemon/process/ProcessRPC'),
  EventEmitter = require('events').EventEmitter

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
      unlink: sinon.stub(),
      stat: sinon.stub(),
      createReadStream: sinon.stub()
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
    var size = 42390823
    processRpc._heapdump.writeSnapshot.callsArgWith(0, undefined, name)
    processRpc._fs.stat.callsArgWith(1, undefined, {
      size: size
    })

    processRpc.dumpHeap(function (error, snapshot) {
      expect(error).to.not.exist

      expect(processRpc._parentProcess.send.calledWith('process:heapdump:start')).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:heapdump:complete')).to.be.true
      expect(snapshot.path).to.contain(name)
      expect(snapshot.size).to.equal(size)

      done()
    })
  })

  it('should dump heap with no callback', function (done) {
    var name = 'foo'
    processRpc._heapdump.writeSnapshot.callsArgWith(0, undefined, name)
    processRpc._fs.stat.callsArgWith(1, undefined, {
      size: 5
    })

    processRpc.dumpHeap()

    setTimeout(function () {
      expect(processRpc._parentProcess.send.calledWith('process:heapdump:start')).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:heapdump:complete')).to.be.true

      done()
    }, 100)
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

  it('should fetch a heap snapshot', function () {
    var snapshot = {
      id: 'foo',
      path: 'bar'
    }
    processRpc._heapSnapshots[snapshot.id] = snapshot

    var onData = sinon.stub()
    var onEnd = sinon.stub()
    var callback = sinon.stub()
    var stream = new EventEmitter()
    stream.pause = sinon.stub()
    stream.resume = sinon.stub()

    processRpc._fs.createReadStream.withArgs(snapshot.path).returns(stream)

    processRpc.fetchHeapSnapshot(snapshot.id, onData, onEnd, callback)

    expect(callback.calledWith(undefined, snapshot)).to.be.true

    expect(onData.called).to.be.false
    stream.emit('data', 'buf')
    expect(onData.calledWith('buf')).to.be.true

    expect(onEnd.called).to.be.false
    stream.emit('end')
    expect(onEnd.called).to.be.true
  })

  it('should pass an error when no snapshot can be found during fetching', function () {
    var callback = sinon.stub()

    processRpc.fetchHeapSnapshot('foo', null, null, callback)

    expect(callback.getCall(0).args[0].message).to.contain('No snapshot for')
    expect(callback.getCall(0).args[0].code).to.equal('ENOENT')
  })

  it('should remove a heap snapshot', function () {
    var snapshot = {
      id: 'foo',
      path: 'bar'
    }
    processRpc._heapSnapshots[snapshot.id] = snapshot

    var callback = sinon.stub()

    processRpc._fs.unlink.withArgs(snapshot.path).callsArg(1)

    processRpc.removeHeapSnapshot(snapshot.id, callback)

    expect(callback.called).to.be.true
    expect(processRpc._parentProcess.send.calledWith('process:heapdump:removed', snapshot)).to.be.true
  })

  it('should remove a non-existent heap snapshot', function () {
    var callback = sinon.stub()

    processRpc.removeHeapSnapshot('foo', callback)

    expect(callback.called).to.be.true
    expect(processRpc._parentProcess.send.calledWith('process:heapdump:removed', {
      id: 'foo'
    })).to.be.true
  })
})
