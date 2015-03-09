var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  NodeInspectorWrapper = require('../../../../lib/daemon/inspector/NodeInspectorWrapper')

describe('NodeInspectorWrapper', function () {

  it('should not start node-inspector when it is not enabled', function (done) {
    var wrapper = new NodeInspectorWrapper()
    wrapper._child_process = {
      fork: sinon.stub()
    }
    wrapper._config = {
      remote: {
        inspector: {
          enabled: false
        }
      }
    }
    wrapper._logger = {
      info: function () {},
      warn: function () {},
      error: function () {},
      debug: function () {}
    }

    wrapper.afterPropertiesSet(function () {
      expect(wrapper._child_process.fork.callCount).to.equal(0)

      done()
    })
  })

  it('should start node-inspector and inform the callback of the port', function (done) {
    var debugPort = 5

    var wrapper = new NodeInspectorWrapper()
    wrapper._child_process = {
      fork: sinon.stub()
    }
    wrapper._config = {
      remote: {
        inspector: {
          enabled: true,
          port: debugPort
        }
      }
    }
    wrapper._logger = {
      info: function () {},
      warn: function () {},
      error: function () {},
      debug: function () {}
    }
    var child = {
      on: sinon.stub(),
      removeAllListeners: sinon.stub(),
      kill: sinon.stub()
    }

    wrapper._child_process.fork.returns(child)

    wrapper.afterPropertiesSet(function (error) {
      expect(error).to.not.exist
      expect(wrapper.debuggerPort).to.equal(debugPort)
      expect(child.on.callCount).to.equal(3)
      expect(child.on.getCall(0).args[0]).to.equal('message')

      done()
    })

    child.on.getCall(0).args[1]({
      event: 'node-inspector:ready',
      args: [debugPort]
    })
  })

  it('should report error when starting node-inspector', function (done) {
    var wrapper = new NodeInspectorWrapper()
    wrapper._child_process = {
      fork: sinon.stub()
    }
    wrapper._config = {
      remote: {
        inspector: {
          enabled: true
        }
      }
    }
    wrapper._logger = {
      info: function () {},
      warn: function () {},
      error: function () {},
      debug: function () {}
    }
    var child = {
      on: sinon.stub(),
      removeAllListeners: sinon.stub(),
      kill: sinon.stub()
    }

    wrapper._child_process.fork.returns(child)

    var startupError = new Error()

    wrapper.afterPropertiesSet(function (error) {
      expect(error.message).to.equal(startupError.message)
      expect(error.stack).to.equal(startupError.stack)

      expect(child.on.callCount).to.equal(3)
      expect(child.on.getCall(0).args[0]).to.equal('message')

      done()
    })

    child.on.getCall(0).args[1]({
      event: 'node-inspector:failed',
      args: [startupError]
    })
  })

  it('should restart node-inspector when it fails', function (done) {
    var wrapper = new NodeInspectorWrapper()
    wrapper._child_process = {
      fork: sinon.stub()
    }
    wrapper._config = {
      remote: {
        inspector: {
          enabled: true
        }
      }
    }
    wrapper._logger = {
      info: function () {},
      warn: function () {},
      error: function () {},
      debug: function () {}
    }
    var child = {
      on: sinon.stub(),
      removeAllListeners: sinon.stub(),
      kill: sinon.stub()
    }

    wrapper._child_process.fork.returns(child)

    wrapper._startNodeInspector()

    expect(child.on.callCount).to.equal(3)
    expect(child.on.getCall(0).args[0]).to.equal('message')
    expect(child.on.getCall(1).args[0]).to.equal('error')
    expect(child.on.getCall(2).args[0]).to.equal('exit')

    expect(wrapper._child_process.fork.callCount).to.equal(1)

    // invoke exit callback
    child.on.getCall(2).args[1](5)

    process.nextTick(function () {
      expect(wrapper._child_process.fork.callCount).to.equal(2)

      done()
    })
  })

  it('should restart node-inspector only once when it errors and exits', function (done) {
    var wrapper = new NodeInspectorWrapper()
    wrapper._child_process = {
      fork: sinon.stub()
    }
    wrapper._config = {
      remote: {
        inspector: {
          enabled: true
        }
      }
    }
    wrapper._logger = {
      info: function () {},
      warn: function () {},
      error: function () {},
      debug: function () {}
    }
    var child = {
      on: sinon.stub(),
      removeAllListeners: sinon.stub(),
      kill: sinon.stub()
    }

    wrapper._child_process.fork.returns(child)

    wrapper._startNodeInspector()

    expect(child.on.callCount).to.equal(3)
    expect(child.on.getCall(0).args[0]).to.equal('message')
    expect(child.on.getCall(1).args[0]).to.equal('error')
    expect(child.on.getCall(2).args[0]).to.equal('exit')

    expect(wrapper._child_process.fork.callCount).to.equal(1)

    // invoke error callback
    child.on.getCall(1).args[1](new Error('Aargh!'))

    // invoke exit callback
    child.on.getCall(2).args[1](5)

    process.nextTick(function () {
      expect(wrapper._child_process.fork.callCount).to.equal(2)

      done()
    })
  })
})
