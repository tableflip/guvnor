var expect = require('chai').expect,
  sinon = require('sinon'),
  StartupNotifier = require('../../../lib/daemon/StartupNotifier')

describe('StartupNotifier', function () {
  var notifier

  beforeEach(function () {
    notifier = new StartupNotifier()
    notifier._parentProcess = {}
    notifier._userRpc = {}
    notifier._adminRpc = {}
    notifier._remoteRpc = {}
    notifier._nodeInspectorWrapper = {}
    notifier._commandLine = {}
    notifier._fileSystem = {
      getRunDir: sinon.stub().returns(process.cwd())
    }
  })

  it('should notify of startup', function (done) {
    notifier._userRpc.socket = 'usersocket'
    notifier._adminRpc.socket = 'adminsocket'
    notifier._remoteRpc.port = 'rpcport'
    notifier._nodeInspectorWrapper.debuggerPort = 'debuggerport'

    notifier._parentProcess.send = function (type, sockets) {
      expect(type).to.equal('daemon:ready')

      // should have been sent the non-privileged socket
      expect(sockets.user).to.equal('usersocket')
      expect(sockets.admin).to.equal('adminsocket')
      expect(sockets.remote).to.equal('rpcport')
      expect(sockets.debug).to.equal('debuggerport')

      done()
    }

    notifier.afterPropertiesSet()
  })
})
