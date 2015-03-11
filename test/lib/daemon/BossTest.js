var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  Guvnor = require('../../../lib/daemon/Guvnor'),
  ProcessInfo = require('../../../lib/daemon/domain/ProcessInfo'),
  EventEmitter = require('events').EventEmitter

describe('Guvnor', function () {
  var guvnor

  beforeEach(function () {
    guvnor = new Guvnor()
    guvnor._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    guvnor._processService = {
      startProcess: sinon.stub(),
      listProcesses: sinon.stub(),
      findByPid: sinon.stub(),
      findById: sinon.stub(),
      on: sinon.stub()
    }
    guvnor._cpuStats = sinon.stub()
    guvnor._config = {
      guvnor: {

      }
    }
    guvnor._os = {
      uptime: sinon.stub(),
      freemem: sinon.stub(),
      totalmem: sinon.stub(),
      cpus: sinon.stub(),
      hostname: sinon.stub()
    }
    guvnor._nodeInspectorWrapper = {}
    guvnor._fs = {
      writeFile: sinon.stub(),
      readFile: sinon.stub()
    }
    guvnor._processInfoStore = {
      save: sinon.stub(),
      all: sinon.stub(),
      find: sinon.stub()
    }
    guvnor._remoteUserService = {
      findOrCreateUser: sinon.stub(),
      createUser: sinon.stub(),
      removeUser: sinon.stub(),
      listUsers: sinon.stub(),
      rotateKeys: sinon.stub()
    }
    guvnor._processInfoStoreFactory = {
      create: sinon.stub()
    }
    guvnor._pem = {
      createCertificate: sinon.stub()
    }
    guvnor._ini = {
      parse: sinon.stub(),
      stringify: sinon.stub()
    }
    guvnor._appService = {
      deploy: sinon.stub(),
      remove: sinon.stub(),
      list: sinon.stub(),
      switchRef: sinon.stub(),
      listRefs: sinon.stub(),
      findByName: sinon.stub()
    }
    guvnor._etc_passwd = {
      getGroups: sinon.stub()
    }
    guvnor._posix = {
      getgrnam: sinon.stub()
    }
  })

  it('should return a list of running processes', function (done) {
    var processes = []
    var numProcesses = Math.floor(Math.random() * 20)

    // Create new process mocks
    for (var i = 0; i < numProcesses; i++) {
      processes.push({
        status: 'running',
        script: 'foo.js',
        remote: {
          reportStatus: function (callback) {
            setTimeout(function () {
              callback(undefined, {
                pid: Math.floor(Math.random() * 138)
              })
            }, Math.floor(Math.random() * 4))
          }
        }
      })
    }

    guvnor._processService.listProcesses.returns(processes)

    // Method under test
    guvnor.listProcesses({}, function (error, procs) {
      expect(error).to.not.exist
      expect(procs.length).to.equal(processes.length)
      done()
    })
  })

  it("should return a list of running processes, even if a process doesn't reply", function (done) {
    this.timeout(10000)

    var processes = []
    var numProcesses = Math.floor(Math.random() * 20)

    // Create new process mocks
    for (var i = 0; i < numProcesses; i++) {
      processes.push({
        status: 'running',
        script: 'foo.js',
        remote: {
          reportStatus: function (callback) {
            var error = new Error('Timed out')
            error.code = 'TIMEOUT'
            callback(error)
          }
        }
      })
    }

    processes.push({
      status: 'paused',
      script: 'foo.js'
    })

    guvnor._processes = processes
    guvnor._processService.listProcesses.returns(processes)

    // Method under test
    guvnor.listProcesses({}, function (error, procs) {
      expect(error).to.not.exist
      expect(procs.length).to.be.equal(processes.length)
      done()
    })
  })

  it('should delegate to process manger to start a process', function () {
    guvnor.startProcess({}, 'script', 'options', 'callback')

    expect(guvnor._processService.startProcess.calledWith('script', 'options', 'callback')).to.be.true
  })

  it('should return server status', function (done) {
    guvnor._config.remote = {
      inspector: {
        enabled: false
      }
    }
    guvnor._cpuStats.callsArgWith(0, undefined, [6, 7])
    guvnor._os.uptime.returns(5)
    guvnor._os.freemem.returns(5)
    guvnor._os.totalmem.returns(5)
    guvnor._os.cpus.returns([{}, {}])
    guvnor._etc_passwd.getGroups.callsArgWith(0, undefined, [{ groupname: 'foo' }, { groupname: '_bar' }])
    guvnor._posix.getgrnam.withArgs('foo').returns({ members: ['baz'] })
    guvnor._posix.getgrnam.withArgs('_bar').returns({ members: ['qux'] })

    guvnor.getServerStatus({}, function (error, status) {
      expect(error).to.not.exist

      expect(status.time).to.be.a('number')
      expect(status.uptime).to.be.a('number')
      expect(status.freeMemory).to.be.a('number')
      expect(status.totalMemory).to.be.a('number')
      expect(status.cpus).to.be.an('array')
      expect(status.debuggerPort).to.not.exist
      expect(status.groups).to.be.an('array')
      expect(status.groups).to.contain('foo')
      expect(status.groups).to.not.contain('_bar')
      expect(status.users).to.be.an('array')
      expect(status.users).to.contain('baz')
      expect(status.users).to.not.contain('qux')

      expect(status.cpus[0].load).to.equal(6)
      expect(status.cpus[1].load).to.equal(7)

      done()
    })
  })

  it('should return server status with debug port', function (done) {
    guvnor._config.remote = {
      inspector: {
        enabled: true
      }
    }
    guvnor._cpuStats.callsArgWith(0, undefined, [])
    guvnor._os.uptime.returns(5)
    guvnor._os.freemem.returns(5)
    guvnor._os.totalmem.returns(5)
    guvnor._os.cpus.returns([])
    guvnor._nodeInspectorWrapper.debuggerPort = 5
    guvnor._etc_passwd.getGroups.callsArgWith(0, undefined, [])

    guvnor.getServerStatus({}, function (error, status) {
      expect(error).to.not.exist

      expect(status.time).to.be.a('number')
      expect(status.uptime).to.be.a('number')
      expect(status.freeMemory).to.be.a('number')
      expect(status.totalMemory).to.be.a('number')
      expect(status.cpus).to.be.an('array')
      expect(status.debuggerPort).to.equal(5)

      done()
    })
  })

  it('should find a process by id', function (done) {
    guvnor._processService.findById.withArgs('foo').returns('bar')

    guvnor.findProcessInfoById({}, 'foo', function (error, process) {
      expect(error).to.not.exist
      expect(process).to.equal('bar')

      done()
    })
  })

  it('should find a process by pid', function (done) {
    guvnor._processService.findByPid.withArgs('foo').returns('bar')

    guvnor.findProcessInfoByPid({}, 'foo', function (error, process) {
      expect(error).to.not.exist
      expect(process).to.equal('bar')

      done()
    })
  })

  it('should dump processes', function (done) {
    guvnor._processInfoStore.save.callsArg(0)

    guvnor.dumpProcesses({}, function (error) {
      expect(error).to.not.exist
      expect(guvnor._processInfoStore.save.callCount).to.equal(1)

      done()
    })
  })

  it('should restore processes', function (done) {
    var store = new EventEmitter()
    store.all = sinon.stub()
    store.all.returns([{ script: 'foo' }, { script: 'bar' }])

    guvnor._processInfoStoreFactory.create.withArgs(['processInfoFactory', 'processes.json'], sinon.match.func).callsArgWith(1, undefined, store)

    guvnor._processService.startProcess.callsArg(2)

    guvnor.restoreProcesses({}, function (error, processes) {
      expect(error).to.not.exist

      expect(processes.length).to.equal(2)

      done()
    })

    // triggers invocation of callback passed to restoreProcesses
    store.emit('loaded')
  })

  it('should return remote host config', function (done) {
    guvnor._config.guvnor = {
      user: 'foo'
    }
    guvnor._config.remote = {
      port: 5
    }
    guvnor._os.hostname.returns('bar')
    guvnor._remoteUserService.findOrCreateUser.withArgs('foo', sinon.match.func).callsArgWith(1, undefined, {
      secret: 'shhh'
    })

    guvnor.remoteHostConfig({}, function (error, hostname, port, user, secret) {
      expect(error).to.not.exist

      expect(hostname).to.equal('bar')
      expect(port).to.equal(5)
      expect(user).to.equal('foo')
      expect(secret).to.equal('shhh')

      done()
    })
  })

  it('should add a remote user', function (done) {
    guvnor._remoteUserService.createUser.withArgs('foo', sinon.match.func).callsArgWith(1, undefined, 'great success')

    guvnor.addRemoteUser({}, 'foo', function (error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should remove a remote user', function (done) {
    guvnor._config.guvnor = {
      user: 'foo'
    }
    guvnor._remoteUserService.removeUser.withArgs('notFoo', sinon.match.func).callsArgWith(1, undefined, 'great success')

    guvnor.removeRemoteUser({}, 'notFoo', function (error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should refuse to remove remote daemon user', function (done) {
    guvnor._config.guvnor = {
      user: 'foo'
    }

    guvnor.removeRemoteUser({}, 'foo', function (error) {
      expect(error).to.be.ok
      expect(error.code).to.equal('WILLNOTREMOVEGUVNORUSER')

      done()
    })
  })

  it('should list remote users', function (done) {
    guvnor._remoteUserService.listUsers.withArgs(sinon.match.func).callsArgWith(0, undefined, 'great success')

    guvnor.listRemoteUsers({}, function (error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should rotate remote keys', function (done) {
    guvnor._remoteUserService.rotateKeys.withArgs('foo', sinon.match.func).callsArgWith(1, undefined, 'great success')

    guvnor.rotateRemoteUserKeys({}, 'foo', function (error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should delegate to app service for deploying applications', function () {
    var name = 'name'
    var url = 'url'
    var user = 'user'
    var onOut = 'onOut'
    var onErr = 'onErr'
    var callback = 'callback'

    guvnor.deployApplication({}, name, url, user, onOut, onErr, callback)

    expect(guvnor._appService.deploy.calledWith(name, url, user, onOut, onErr, callback)).to.be.true
  })

  it('should delegate to app service for removing applications', function () {
    var name = 'name'
    var callback = 'callback'

    guvnor.removeApplication({}, name, callback)

    expect(guvnor._appService.remove.calledWith(name, callback)).to.be.true
  })

  it('should delegate to app service for listing applications', function () {
    var callback = 'callback'

    guvnor.listApplications({}, callback)

    expect(guvnor._appService.list.calledWith(callback)).to.be.true
  })

  it('should delegate to app service for switching application refs', function () {
    var name = 'name'
    var ref = 'ref'
    var onOut = 'onOut'
    var onErr = 'onErr'
    var callback = 'callback'

    guvnor.switchApplicationRef({}, name, ref, onOut, onErr, callback)

    expect(guvnor._appService.switchRef.calledWith(name, ref, onOut, onErr, callback)).to.be.true
  })

  it('should delegate to app service for listing application refs', function () {
    var name = 'name'
    var callback = 'callback'

    guvnor.listApplicationRefs({}, name, callback)

    expect(guvnor._appService.listRefs.calledWith(name, callback)).to.be.true
  })

  it('should generate ssl keys', function (done) {
    var config = {
      guvnor: {
        confdir: 'conf'
      }
    }

    guvnor._config.guvnor.confdir = 'conf'
    guvnor._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'cert'
    })
    guvnor._fs.writeFile.withArgs('conf/rpc.key', 'key').callsArg(3)
    guvnor._fs.writeFile.withArgs('conf/rpc.cert', 'cert').callsArg(3)
    guvnor._fs.readFile.withArgs('conf/guvnorrc', 'utf-8').callsArgWith(2, undefined, 'ini')
    guvnor._ini.parse.withArgs('ini').returns(config)
    guvnor._ini.stringify.withArgs(config).returns('ini-updated')
    guvnor._fs.writeFile.withArgs('conf/guvnorrc', 'ini-updated').callsArg(3)

    guvnor.generateRemoteRpcCertificates({}, 10, function (error, path) {
      expect(error).to.not.exist
      expect(path).to.equal('conf/guvnorrc')

      done()
    })
  })
})
