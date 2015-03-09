var expect = require('chai').expect,
  posix = require('posix'),
  shortid = require('shortid'),
  os = require('os'),
  path = require('path')

var user = posix.getpwnam(process.getuid())
var group = posix.getgrnam(process.getgid())

var config = {
  guvnor: {
    user: user.name,
    group: group.name,
    timeout: 0,
    autoresume: false,
    rpctimeout: 0
  },
  remote: {
    enabled: false,

    inspector: {
      enabled: false
    }
  },
  debug: {
    daemon: false,
    cluster: false
  }
}
var logger = {
  info: console.log,
  warn: console.log,
  error: console.log,
  debug: console.log
}

function requireUncached(module) {
  var dirPath = path.resolve(__dirname + '/../../lib')

  for(var key in require.cache) {
    if(key.substring(0, dirPath.length) == dirPath) {
      delete require.cache[key]
    }
  }

  delete require.cache[path.resolve(__dirname + '/../../node_modules/commander/index.js')]

  return require(module)
}

var remote = require('../../lib/local').connectOrStart,
  remote = remote.bind(null, config, logger)

var guvnor
var tmpdir

describe('Guvnor CLI', function () {
  // integration tests are slow
  this.timeout(0)

  var info

  beforeEach(function (done) {
    info = console.info
    process.env.GUVNOR_ALLOW_UKNOWN_OPTION = true

    tmpdir = os.tmpdir() + '/' + shortid.generate()
    tmpdir = tmpdir.replace(/\/\//g, '/')

    config.guvnor.logdir = tmpdir + '/logs'
    config.guvnor.rundir = tmpdir + '/run'
    config.guvnor.confdir = tmpdir + '/conf'
    config.guvnor.appdir = tmpdir + '/apps'

    console.info('rundir:', config.guvnor.rundir)

    remote(function (error, daemon) {
      if (error)
        throw error

      guvnor = daemon

      // log all received events
      guvnor.on('*', function (type) {
        if (type.substring(0, 'daemon:log'.length) == 'daemon:log' ||
          type.substring(0, 'process:uncaughtexception'.length) == 'process:uncaughtexception' ||
          type.substring(0, 'daemon:fatality'.length) == 'daemon:fatality' ||
          type.substring(0, 'process:log'.length) == 'process:log' ||
          type.substring(0, 'worker:log'.length) == 'worker:log') {
          // already handled
          return
        }

        console.log(type)
      })
      guvnor.on('daemon:log:*', function (type, event) {
        console.log(type, event.message)
      })
      guvnor.on('process:log:*', function (type, processInfo, event) {
        console.log(type, processInfo.id, event)
      })
      guvnor.on('cluster:log:*', function (type, processInfo, event) {
        console.log(type, processInfo.id, event)
      })
      guvnor.on('worker:log:*', function (type, clusterInfo, workerInfo, event) {
        console.log(type, workerInfo.id, event)
      })
      guvnor.on('process:uncaughtexception:*', function (type, error) {
        console.log(error.stack)
      })
      guvnor.on('daemon:fatality', function (error) {
        console.log(error.stack)
      })

      done()
    })
  })

  afterEach(function (done) {
    console.info = info
    delete process.env.GUVNOR_ALLOW_UKNOWN_OPTION

    guvnor.callbacks = {}
    guvnor.kill(guvnor.disconnect.bind(guvnor, done))
  })

  function runCli () {
    process.env.GUVNOR_ALLOW_UKNOWN_OPTION = true

    process.argv = [process.argv[0], process.argv[1]].concat(Array.prototype.slice.call(arguments)).concat([
      '--guvnor.rundir=' + config.guvnor.rundir,
      '--guvnor.logdir=' + config.guvnor.logdir,
      '--guvnor.confdir=' + config.guvnor.confdir,
      '--guvnor.appdir=' + config.guvnor.appdir,
      '--guvnor.user=' + config.guvnor.user,
      '--guvnor.group=' + config.guvnor.group,
      '--guvnor.timeout=' + config.guvnor.timeout,
      '--guvnor.autoresume=' + config.guvnor.autoresume,
      '--guvnor.rpctimeout=' + config.guvnor.rpctimeout,
      '--remote.enabled=' + config.remote.enabled,
      '--remote.inspector.enabled=' + config.remote.inspector.enabled,
      '--debug.daemon=' + config.debug.daemon,
      '--debug.cluster=' + config.debug.cluster
    ])

    requireUncached('../../lib/cli')
  }

  it('should print message when no processes are running', function (done) {
    console.info = function(string) {
      expect(string).to.contain('No running processes')

      done()
    }

    runCli('list')
  })

  it('should list processes', function (done) {
    var seenHeader = false

    console.info = function(string) {
      if (!seenHeader) {
        // first line is a header
        expect(string).to.contain('User')
        expect(string).to.contain('Group')
        expect(string).to.contain('Name')
        expect(string).to.contain('Uptime')
        expect(string).to.contain('Restarts')
        expect(string).to.contain('CPU')
        expect(string).to.contain('RSS')
        expect(string).to.contain('Heap size')
        expect(string).to.contain('Heap used')
        expect(string).to.contain('Status')
        expect(string).to.contain('Type')
        seenHeader = true
      } else {
        // second line contains process information
        expect(string).to.contain('hello-world')

        done()
      }
    }

    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      guvnor.once('process:ready', function () {
        runCli('list')
      })
    })
  })

  it('should start a process', function (done) {
    guvnor.once('process:ready', function (processInfo) {
      expect(processInfo.name).to.equal('hello-world.js')

      done()
    })

    runCli('start', __dirname + '/fixtures/hello-world.js')
  })

  it('should start a process and override the name', function (done) {
    var name = 'foo'

    guvnor.once('process:ready', function (processInfo) {
      expect(processInfo.name).to.equal(name)

      done()
    })

    runCli('start', __dirname + '/fixtures/hello-world.js', '-n', name)
  })

  it('should restart a process', function (done) {
    guvnor.once('process:ready', function (readyProcessInfo) {
      expect(readyProcessInfo.name).to.equal('hello-world.js')

      guvnor.once('process:restarted', function (restartedProcessInfo) {
        expect(restartedProcessInfo.id).to.equal(readyProcessInfo.id)

        done()
      })

      runCli('restart', 'hello-world.js')
    })

    runCli('start', __dirname + '/fixtures/hello-world.js')
  })

  it('should stop a process', function (done) {
    guvnor.once('process:exit', function (processInfo) {
      expect(processInfo.name).to.equal('hello-world.js')

      guvnor.listProcesses(function(error, processes) {
        expect(error).to.not.exist
        expect(processes[0].status).to.equal('stopped')

        done()
      })
    })

    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      processInfo.once('process:ready', function() {
        runCli('stop', processInfo.name)
      })
    })
  })

  it('should stop and remove a running process', function (done) {
    guvnor.once('process:exit', function () {
      setTimeout(function() {
        guvnor.listProcesses(function(error, processes) {
          expect(error).to.not.exist
          expect(processes).to.be.empty

          done()
        })
      }, 500)
    })

    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      processInfo.once('process:ready', function() {
        runCli('remove', processInfo.name)
      })
    })
  })

  it('should start a process with arguments', function (done) {
    guvnor.once('arguments:received', function (processInfo, a, foo, b, bar) {
      expect(a).to.equal('-a')
      expect(foo).to.equal('foo')
      expect(b).to.equal('-b')
      expect(bar).to.equal('bar')

      expect(processInfo.argv).to.contain('-a')
      expect(processInfo.argv).to.contain('foo')
      expect(processInfo.argv).to.contain('-b')
      expect(processInfo.argv).to.contain('bar')

      done()
    })

    runCli('start', __dirname + '/fixtures/arguments.js', '-a', '-a foo -b bar')
  })

  it('should start a process with exec arguments', function (done) {
    guvnor.once('arguments:received', function (processInfo, harmony) {
      expect(harmony).to.equal('--harmony')

      expect(processInfo.execArgv).to.contain('--harmony')

      done()
    })

    runCli('start', __dirname + '/fixtures/exec-arguments.js', '-e', '--harmony')
  })

  it('should start a process as a cluster', function (done) {
    guvnor.once('cluster:ready', function (clusterInfo) {
      expect(clusterInfo.workers.length).to.equal(2)

      done()
    })

    runCli('start', __dirname + '/fixtures/hello-world.js', '-i', '2')
  })
})
