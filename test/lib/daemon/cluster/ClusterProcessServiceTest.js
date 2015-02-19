var expect = require('chai').expect,
  sinon = require('sinon'),
  ClusterProcessService = require('../../../../lib/daemon/cluster/ClusterProcessService')

describe('ClusterProcessService', function() {

  it('should start a process', function(done) {
    var service = new ClusterProcessService()
    service._freeport = sinon.stub()
    service._processInfoStore = {
      create: sinon.stub(),
      find: sinon.stub()
    }
    service._parentProcess = {
      send: sinon.stub()
    }
    service._cluster = {
      fork: sinon.stub(),
      on: sinon.stub(),
      setupMaster: sinon.stub()
    }
    service._logger = {
      info: console.info,
      warn: console.info,
      error: console.info,
      debug: console.info
    }

    var processOptions = {
      execArgv: [],
      env: []
    }
    var worker = {
      id: 'hello',
      process: {
        on: sinon.stub()
      }
    }
    var initialProcessInfo = {
      id: 'foo',
      status: 'uninitialised',
      getProcessOptions: function() {
        return processOptions
      },
      getProcessArgs: function() {
        return []
      },
      process: worker.process
    }

    var script = 'foo.js'

    process.env.GUVNOR_SCRIPT = script

    service._freeport.callsArgWith(0, undefined, 5)
    service._processInfoStore.create.callsArgWith(1, undefined, initialProcessInfo)
    service._processInfoStore.find.withArgs('worker.id', worker.id).returns(initialProcessInfo)
    service._cluster.fork.withArgs(processOptions.env).returns(worker)

    var notifiedOfClusterWorkerStarting = false
    var notifiedOfClusterWorkerFork = false

    service.on('worker:starting', function(processInfo) {
      if(initialProcessInfo.id != processInfo.id) {
        return
      }

      expect(processInfo).to.equal(initialProcessInfo)

      notifiedOfClusterWorkerStarting = true
    })
    service.on('worker:forked', function(processInfo) {
      if(initialProcessInfo.id != processInfo.id) {
        return
      }

      expect(processInfo).to.equal(initialProcessInfo)

      notifiedOfClusterWorkerFork = true
    })

    service.afterPropertiesSet()

    service.startProcess(function(error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo).to.equal(initialProcessInfo)

      expect(notifiedOfClusterWorkerStarting).to.be.true

      expect(processInfo.status).to.equal('uninitialised')

      expect(service._cluster.on.getCall(1).args[0]).to.equal('online')
      var listener = service._cluster.on.getCall(1).args[1]
      listener(worker)

      expect(processInfo.status).to.equal('starting')

      done()
    })
  })
})
