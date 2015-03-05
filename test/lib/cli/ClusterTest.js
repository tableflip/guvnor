var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  Cluster = require('../../../lib/cli/Cluster')

describe('Cluster', function () {
  var cluster, guvnor

  beforeEach(function () {
    cluster = new Cluster()
    cluster._config = {
      guvnor: {

      }
    }
    cluster._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    cluster._connectOrStart = sinon.stub()

    guvnor = {
      disconnect: sinon.stub().callsArg(0),
      on: sinon.stub(),
      findProcessInfoByPid: sinon.stub(),
      findProcessInfoByName: sinon.stub(),
      connectToProcess: sinon.stub(),
      listProcesses: sinon.stub()
    }

    cluster._connectOrStart.callsArgWith(0, undefined, guvnor)
  })

  it('should set the number of cluster workers', function () {
    var name = 'name'
    var workers = 5
    var options = {}

    var managedProcess = {
      name: name,
      setClusterWorkers: sinon.stub().withArgs(workers).callsArg(1),
      disconnect: sinon.stub()
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    cluster.setClusterWorkers(name, workers, options)

    expect(guvnor.disconnect.called).to.be.true
    expect(managedProcess.disconnect.called).to.be.true
  })

  it("should object when trying to set workers to something that isn't a number", function () {
    cluster.setClusterWorkers('one', 'two')

    expect(cluster._logger.error.called).to.be.true
  })

  it('should fail to set the number of cluster workers', function () {
    var name = 'name'
    var workers = 5
    var options = {}
    var error = new Error('workers!')

    var managedProcess = {
      name: name,
      setClusterWorkers: sinon.stub().withArgs(workers).callsArgWith(1, error),
      disconnect: sinon.stub()
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    expect(cluster.setClusterWorkers.bind(cluster, name, workers, options)).to.throw(error)
    expect(guvnor.disconnect.called).to.be.true
    expect(managedProcess.disconnect.called).to.be.true
  })
})
