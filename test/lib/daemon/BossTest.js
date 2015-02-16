var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  Boss = require('../../../lib/daemon/Boss'),
  ProcessInfo = require('../../../lib/daemon/domain/ProcessInfo'),
  EventEmitter = require('events').EventEmitter

describe('Boss', function() {
  var boss

  beforeEach(function() {
    boss = new Boss()
    boss._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    boss._processService = {
      startProcess: sinon.stub(),
      listProcesses: sinon.stub(),
      findByPid: sinon.stub(),
      findById: sinon.stub(),
      on: sinon.stub()
    }
    boss._cpuStats = sinon.stub()
    boss._config = {
      boss: {

      }
    }
    boss._os = {
      uptime: sinon.stub(),
      freemem: sinon.stub(),
      totalmem: sinon.stub(),
      cpus: sinon.stub(),
      hostname: sinon.stub()
    }
    boss._nodeInspectorWrapper = {}
    boss._fs = {
      writeFile: sinon.stub(),
      readFile: sinon.stub()
    }
    boss._processInfoStore = {
      save: sinon.stub(),
      all: sinon.stub(),
      find: sinon.stub()
    }
    boss._remoteUserService = {
      findOrCreateUser: sinon.stub(),
      createUser: sinon.stub(),
      removeUser: sinon.stub(),
      listUsers: sinon.stub(),
      rotateKeys: sinon.stub()
    }
    boss._processInfoStoreFactory = {
      create: sinon.stub()
    }
    boss._pem = {
      createCertificate: sinon.stub()
    }
    boss._ini = {
      parse: sinon.stub(),
      stringify: sinon.stub()
    }
    boss._appService = {
      deploy: sinon.stub(),
      remove: sinon.stub(),
      list: sinon.stub(),
      switchRef: sinon.stub(),
      listRefs: sinon.stub(),
      findByName: sinon.stub()
    }
    boss._etc_passwd = {
      getGroups: sinon.stub()
    }
    boss._posix = {
      getgrnam: sinon.stub()
    }
  })

  it('should return a list of running processes', function(done) {
    var processes = []
    var numProcesses = Math.floor(Math.random() * 20)

    // Create new process mocks
    for (var i = 0; i < numProcesses; i++) {
      processes.push({
        status: 'running',
        script: 'foo.js',
        remote: {
          reportStatus: function(callback) {
            setTimeout(function() {
              callback(undefined, {
                pid: Math.floor(Math.random() * 138)
              })
            }, Math.floor(Math.random() * 4))
          }
        }
      })
    }

    boss._processService.listProcesses.returns(processes)

    // Method under test
    boss.listProcesses(function(error, procs) {
      expect(error).to.not.exist
      expect(procs.length).to.equal(processes.length)
      done()
    })
  })

  it('should return a list of running processes, even if a process doesn\'t reply', function (done) {
    this.timeout(10000)

    var processes = []
    var numProcesses = Math.floor(Math.random() * 20)

    // Create new process mocks
    for (var i = 0; i < numProcesses; i++) {
      processes.push({
        status: 'running',
        script: 'foo.js',
        remote: {
          reportStatus: function(callback) {
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

    boss._processes = processes
    boss._processService.listProcesses.returns(processes)

    // Method under test
    boss.listProcesses(function (error, procs) {
      expect(error).to.not.exist
      expect(procs.length).to.be.equal(processes.length)
      done()
    })
  })

  it('should delegate to process manger to start a process', function() {
    boss.startProcess('script', 'options', 'callback')

    expect(boss._processService.startProcess.calledWith('script', 'options', 'callback')).to.be.true
  })

  it('should return server status', function(done) {
    boss._config.remote = {
      inspector: {
        enabled: false
      }
    }
    boss._cpuStats.callsArgWith(0, undefined, [6, 7])
    boss._os.uptime.returns(5)
    boss._os.freemem.returns(5)
    boss._os.totalmem.returns(5)
    boss._os.cpus.returns([{}, {}])
    boss._etc_passwd.getGroups.callsArgWith(0, undefined, [{groupname: 'foo'}, {groupname: '_bar'}])
    boss._posix.getgrnam.withArgs('foo').returns({members: ['baz']})
    boss._posix.getgrnam.withArgs('_bar').returns({members: ['qux']})

    boss.getServerStatus(function(error, status) {
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

  it('should return server status with debug port', function(done) {
    boss._config.remote = {
      inspector: {
        enabled: true
      }
    }
    boss._cpuStats.callsArgWith(0, undefined, [])
    boss._os.uptime.returns(5)
    boss._os.freemem.returns(5)
    boss._os.totalmem.returns(5)
    boss._os.cpus.returns([])
    boss._nodeInspectorWrapper.debuggerPort = 5
    boss._etc_passwd.getGroups.callsArgWith(0, undefined, [])

    boss.getServerStatus(function(error, status) {
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

  it('should find a process by id', function(done) {
    boss._processService.findById.withArgs('foo').returns('bar')

    boss.findProcessInfoById('foo', function(error, process) {
      expect(error).to.not.exist
      expect(process).to.equal('bar')

      done()
    })
  })

  it('should find a process by pid', function(done) {
    boss._processService.findByPid.withArgs('foo').returns('bar')

    boss.findProcessInfoByPid('foo', function(error, process) {
      expect(error).to.not.exist
      expect(process).to.equal('bar')

      done()
    })
  })

  it('should dump processes', function(done) {
    boss._processInfoStore.save.callsArg(0)

    boss.dumpProcesses(function(error) {
      expect(error).to.not.exist
      expect(boss._processInfoStore.save.callCount).to.equal(1)

      done()
    })
  })

  it('should restore processes', function(done) {
    var store = new EventEmitter()
    store.all = sinon.stub()
    store.all.returns([{script: 'foo'}, {script: 'bar'}])

    boss._processInfoStoreFactory.create.withArgs(['processInfoFactory', 'processes.json'], sinon.match.func).callsArgWith(1, undefined, store)

    boss._processService.startProcess.callsArg(2)

    boss.restoreProcesses(function(error, processes) {
      expect(error).to.not.exist

      expect(processes.length).to.equal(2)

      done()
    })

    // triggers invocation of callback passed to restoreProcesses
    store.emit('loaded')
  })

  it('should return remote host config', function(done) {
    boss._config.boss = {
      user: 'foo'
    }
    boss._config.remote = {
      port: 5
    }
    boss._os.hostname.returns('bar')
    boss._remoteUserService.findOrCreateUser.withArgs('foo', sinon.match.func).callsArgWith(1, undefined, {
      secret: 'shhh'
    })

    boss.remoteHostConfig(function(error, hostname, port, user, secret) {
      expect(error).to.not.exist

      expect(hostname).to.equal('bar')
      expect(port).to.equal(5)
      expect(user).to.equal('foo')
      expect(secret).to.equal('shhh')

      done()
    })
  })

  it('should add a remote user', function(done) {
    boss._remoteUserService.createUser.withArgs('foo', sinon.match.func).callsArgWith(1, undefined, 'great success')

    boss.addRemoteUser('foo', function(error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should remove a remote user', function(done) {
    boss._config.boss = {
      user: 'foo'
    }
    boss._remoteUserService.removeUser.withArgs('notFoo', sinon.match.func).callsArgWith(1, undefined, 'great success')

    boss.removeRemoteUser('notFoo', function(error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should refuse to remove remote daemon user', function(done) {
    boss._config.boss = {
      user: 'foo'
    }

    boss.removeRemoteUser('foo', function(error) {
      expect(error).to.be.ok
      expect(error.code).to.equal('WILLNOTREMOVEBOSSUSER')

      done()
    })
  })

  it('should list remote users', function(done) {
    boss._remoteUserService.listUsers.withArgs(sinon.match.func).callsArgWith(0, undefined, 'great success')

    boss.listRemoteUsers(function(error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should rotate remote keys', function(done) {
    boss._remoteUserService.rotateKeys.withArgs('foo', sinon.match.func).callsArgWith(1, undefined, 'great success')

    boss.rotateRemoteUserKeys('foo', function(error, result) {
      expect(error).to.not.exist

      expect(result).to.equal('great success')

      done()
    })
  })

  it('should send a signal to a process', function(done) {
    boss._processService.processes = {
      foo: {
        process: {
          kill: sinon.stub()
        }
      }
    }

    boss.sendSignal('foo', 'bar', function(error) {
      expect(error).to.not.exist

      expect(boss._processService.processes.foo.process.kill.calledWith('bar')).to.be.true

      done()
    })
  })

  it('should not send a signal to a process when wrong process id sent', function(done) {
    boss._processService.processes = {
      foo: {
        process: {
          kill: sinon.stub()
        }
      }
    }

    boss.sendSignal('bar', 'foo', function(error) {
      expect(error).to.be.ok
      expect(error.message).to.contain('No process')

      expect(boss._processService.processes.foo.process.kill.called).to.be.false

      done()
    })
  })

  it('should not send a signal to a process when signal name is invalid', function(done) {
    boss._processService.processes = {
      foo: {
        process: {
          kill: sinon.stub()
        }
      }
    }
    boss._processService.processes.foo.process.kill.throws(new Error('bad signal'))

    boss.sendSignal('foo', 'bar', function(error) {
      expect(error).to.be.ok
      expect(error.message).to.contain('bad signal')

      done()
    })
  })

  it('should delegate to app service for deploying applications', function() {
    var name = 'name'
    var url = 'url'
    var user = 'user'
    var onOut = 'onOut'
    var onErr = 'onErr'
    var callback = 'callback'

    boss.deployApplication(name, url, user, onOut, onErr, callback)

    expect(boss._appService.deploy.calledWith(name, url, user, onOut, onErr, callback)).to.be.true
  })

  it('should delegate to app service for removing applications', function() {
    var name = 'name'
    var callback = 'callback'

    boss.removeApplication(name, callback)

    expect(boss._appService.remove.calledWith(name, callback)).to.be.true
  })

  it('should delegate to app service for listing applications', function() {
    var callback = 'callback'

    boss.listApplications(callback)

    expect(boss._appService.list.calledWith(callback)).to.be.true
  })

  it('should delegate to app service for switching application refs', function() {
    var name = 'name'
    var ref = 'ref'
    var onOut = 'onOut'
    var onErr = 'onErr'
    var callback = 'callback'

    boss.switchApplicationRef(name, ref, onOut, onErr, callback)

    expect(boss._appService.switchRef.calledWith(name, ref, onOut, onErr, callback)).to.be.true
  })

  it('should delegate to app service for listing application refs', function() {
    var name = 'name'
    var callback = 'callback'

    boss.listApplicationRefs(name, callback)

    expect(boss._appService.listRefs.calledWith(name, callback)).to.be.true
  })

  it('should generate ssl keys', function(done) {
    var config = {
      boss: {
        confdir: 'conf'
      }
    }

    boss._config.confdir = 'conf'
    boss._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'cert'
    })
    boss._fs.writeFile.withArgs('conf/rpc.key', 'key').callsArg(3)
    boss._fs.writeFile.withArgs('conf/rpc.cert', 'cert').callsArg(3)
    boss._fs.readFile.withArgs('conf/bossrc', 'utf-8').callsArgWith(2, undefined, 'ini')
    boss._ini.parse.withArgs('ini').returns(config)
    boss._ini.stringify.withArgs(config).returns('ini-updated')
    boss._fs.writeFile.withArgs('conf/bossrc', 'ini-updated').callsArg(3)

    boss.generateRemoteRpcCertificates(10, function(error, path) {
      expect(error).to.not.exist
      expect(path).to.equal('conf/bossrc')

      done()
    })
  })
})
