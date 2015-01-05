var expect = require('chai').expect,
  sinon = require('sinon'),
  ClusterProcessWrapper = require('../../../../lib/daemon/cluster/ClusterProcessWrapper'),
  EventEmitter = require('events').EventEmitter

describe('ClusterProcessWrapper', function() {
  var wrapper

  beforeEach(function() {
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

  it('should start up', function(done) {
    wrapper._processRpc.startDnodeServer.callsArgWith(0, undefined, '/foo/bar')

    wrapper._parentProcess.send = function(type, socket) {
      expect(type).to.equal('cluster:started')
      expect(socket).to.equal('/foo/bar')

      done()
    }

    wrapper.afterPropertiesSet()
  })
})
