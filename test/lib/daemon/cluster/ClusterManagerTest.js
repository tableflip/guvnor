var expect = require('chai').expect,
  sinon = require('sinon'),
  ClusterManager = require('../../../../lib/daemon/cluster/ClusterManager'),
  EventEmitter = require('wildemitter')

describe('ClusterManager', function() {
  var manager

  beforeEach(function() {
    manager = new ClusterManager()
    manager._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    manager._processRpc = {
      startDnodeServer: sinon.stub()
    }
    manager._parentProcess = {
      send: sinon.stub()
    }
    manager._os = {
      cpus: sinon.stub()
    }
    manager._cluster = {
      on: sinon.stub()
    }
    manager._processService = new EventEmitter()
    manager._processService.listProcesses = sinon.stub()
    manager._processService.startProcess = sinon.stub()
  })

  it('should start up', function(done) {
    manager._processService.listProcesses.returns([{}])

    manager.afterPropertiesSet(done)
  })

  it('should increase number of cluster workers', function(done) {
    var children = []
    manager._processService.listProcesses.returns(children)
    manager._numWorkers = 2
    manager._processService.startProcess.callsArgWith(0, undefined, {})

    manager._updateWorkers(function() {
      done()
    })

    manager._processService.emit('worker:ready', {})
    manager._processService.emit('worker:ready', {})
  })

  it('should decrease number of cluster workers', function(done) {
    var children = [{}, {}, {}]
    manager._processService.listProcesses.returns(children)
    manager._numWorkers = 1
    manager._processService.stopProcess = sinon.stub()

    manager._updateWorkers(function() {
      expect(manager._processService.stopProcess.callCount).to.equal(2)

      done()
    })
  })

  it('should not set the number of workers more than cpus.length - 1', function(done) {
    manager._os.cpus.returns([{}, {}])
    manager._processService.listProcesses.returns([{}])

    manager.setNumWorkers(4, function(error) {
      expect(error).to.not.exist

      expect(manager._numWorkers).to.equal(1)

      done()
    })
  })

  it('should set the number of workers where allowed by cpus.length', function(done) {
    manager._os.cpus.returns([{}, {}, {}, {}])
    manager._processService.listProcesses.returns([{}, {}])

    manager.setNumWorkers(2, function(error) {
      expect(error).to.not.exist

      expect(manager._numWorkers).to.equal(2)

      done()
    })
  })
})
