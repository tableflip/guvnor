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
      chmod: sinon.stub()
    }
    processRpc._heapdump = {
      writeSnapshot: sinon.stub()
    }
    processRpc._config = {
      guvnor: {

      }
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

  it('should allow sending an event to the process', function (done) {
    process.once('event:one', done)

    processRpc.send('event:one')
  })

  it('should allow sending an event to the process with arguments', function (done) {
    process.once('event:two', function (foo, bar) {
      expect(foo).to.equal('foo')
      expect(bar).to.equal('bar')

      done()
    })

    processRpc.send('event:two', 'foo', 'bar')
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

      expect(processRpc._parentProcess.send.calledWith('process:gc:start')).to.be.true
      expect(processRpc._parentProcess.send.calledWith('process:gc:complete')).to.be.true

      done()
    })
  })
})
