var expect = require('chai').expect,
  sinon = require('sinon'),
  ClusterProcessWrapper = require('../../../../lib/daemon/cluster/ClusterProcessWrapper'),
  EventEmitter = require('events').EventEmitter

describe('ClusterProcessWrapper', function() {
  var wrapper, name

  beforeEach(function() {
    name = process.title

    wrapper = new ClusterProcessWrapper()
    wrapper._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    wrapper._processRpc = {
      startDnodeServer: sinon.stub()
    }
    wrapper._parentProcess = {
      send: sinon.stub()
    }
  })

  afterEach(function() {
    process.title = name
  })

  it('should start up', function(done) {
    process.env.GUVNOR_PROCESS_NAME = 'ClusterProcessWrapperTest-startup'

    wrapper._processRpc.startDnodeServer.callsArgWith(0, undefined, '/foo/bar')

    wrapper._parentProcess.send = function(type, socket) {
      expect(type).to.equal('cluster:started')
      expect(socket).to.equal('/foo/bar')

      done()
    }

    wrapper.afterPropertiesSet()
  })
})
