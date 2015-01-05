var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  Cluster = require('../../../lib/cli/Cluster')

describe('Cluster', function() {
  var cluster, boss

  beforeEach(function() {
    cluster = new Cluster()
    cluster._config = {
      boss: {

      }
    }
    cluster._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    cluster._connect = sinon.stub()

    boss = {
      disconnect: sinon.stub(),
      on: sinon.stub(),
      findProcessInfoByPid: sinon.stub(),
      findProcessInfoByName: sinon.stub(),
      connectToProcess: sinon.stub()
    }

    cluster._connect.callsArgWith(0, undefined, boss)
  })

  it('should set the number of cluster workers', function() {
    var pid = 'pid'
    var workers = 5
    var options = {}

    var processInfo = {
      id: 'id'
    }
    var remote = {
      setClusterWorkers: sinon.stub(),
      disconnect: sinon.stub()
    }
    remote.setClusterWorkers.withArgs(workers).callsArg(1)

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    cluster.setClusterWorkers(pid, workers, options)

    expect(boss.disconnect.called).to.be.true
    expect(remote.disconnect.called).to.be.true
  })

  it('should object when trying to set workers to something that isn\'t a number', function() {
    cluster.setClusterWorkers('one', 'two')

    expect(cluster._logger.error.called).to.be.true
  })

  it('should fail to set the number of cluster workers', function() {
    var pid = 'pid'
    var workers = 5
    var options = {}

    var processInfo = {
      id: 'id'
    }
    var remote = {
      setClusterWorkers: sinon.stub(),
      disconnect: sinon.stub()
    }
    remote.setClusterWorkers.withArgs(workers).callsArgWith(1, new Error('workers!'))

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    cluster.setClusterWorkers(pid, workers, options)

    expect(cluster._logger.error.called).to.be.true
    expect(boss.disconnect.called).to.be.true
    expect(remote.disconnect.called).to.be.true
  })
})
