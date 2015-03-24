var expect = require('chai').expect,
  sinon = require('sinon'),
  posix = require('posix'),
  shortid = require('shortid'),
  os = require('os'),
  path = require('path'),
  util = require('util'),
  async = require('async'),
  fs = require('fs'),
  ini = require('ini'),
  exec = require('./fixtures/exec'),
  logDaemonMessages = require('./fixtures/log-daemon-messages')

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

if (process.env.npm_package_version) {
  logger = {
    info: sinon.stub(),
    warn: sinon.stub(),
    error: sinon.stub(),
    debug: sinon.stub()
  }
}

function runCli() {
  process.env.GUVNOR_ALLOW_UKNOWN_OPTION = true

  process.argv = process.argv.slice(0, 2).concat(Array.prototype.slice.call(arguments)).concat([
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

  var paths = [
    path.resolve(__dirname + '/../../lib'),
    path.resolve(__dirname + '/../../node_modules/commander/index.js')
  ]
  paths.forEach(function (path) {
    for (var key in require.cache) {
      if (key.indexOf(path) != -1) {
        delete require.cache[key]
      }
    }
  })

  require('../../lib/cli')()
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

    remote(function (error, daemon) {
      if (error) {
        throw error
      }

      guvnor = daemon

      logDaemonMessages(guvnor)

      done()
    })
  })

  afterEach(function (done) {
    console.info = info
    delete process.env.GUVNOR_ALLOW_UKNOWN_OPTION

    guvnor.callbacks = {}
    guvnor.kill(guvnor.disconnect.bind(guvnor, done))
  })

  it('should print message when no processes are running', function (done) {
    console.info = function (string) {
      expect(string).to.contain('No running processes')

      done()
    }

    runCli('list')
  })

  it('should list processes', function (done) {
    var seenHeader = false

    console.info = function (string) {
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

      guvnor.listProcesses(function (error, processes) {
        expect(error).to.not.exist
        expect(processes[0].status).to.equal('stopped')

        done()
      })
    })

    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      processInfo.once('process:ready', function () {
        runCli('stop', processInfo.name)
      })
    })
  })

  it('should stop and remove a running process', function (done) {
    guvnor.once('process:exit', function () {
      setTimeout(function () {
        guvnor.listProcesses(function (error, processes) {
          expect(error).to.not.exist
          expect(processes).to.be.empty

          done()
        })
      }, 500)
    })

    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      processInfo.once('process:ready', function () {
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
    guvnor.once('cluster:online', function (clusterInfo) {
      expect(clusterInfo.workers.length).to.equal(2)

      done()
    })

    runCli('start', __dirname + '/fixtures/hello-world.js', '-i', '2')
  })

  it('should increase number of cluster workers', function (done) {
    guvnor.once('cluster:online', function (clusterInfo) {
      expect(clusterInfo.instances).to.equal(2)
      expect(clusterInfo.workers.length).to.equal(2)

      guvnor.once('cluster:online', function (clusterInfo) {
        expect(clusterInfo.instances).to.equal(3)
        expect(clusterInfo.workers.length).to.equal(3)

        done()
      })

      runCli('workers', 'hello-world.js', '3')
    })

    runCli('start', __dirname + '/fixtures/hello-world.js', '-i', '2')
  })

  it('should decrease number of cluster workers', function (done) {
    guvnor.once('cluster:online', function (clusterInfo) {
      expect(clusterInfo.instances).to.equal(2)
      expect(clusterInfo.workers.length).to.equal(2)

      guvnor.once('cluster:online', function (clusterInfo) {
        expect(clusterInfo.instances).to.equal(1)
        expect(clusterInfo.workers.length).to.equal(1)

        done()
      })

      runCli('workers', 'hello-world.js', '1')
    })

    runCli('start', __dirname + '/fixtures/hello-world.js', '-i', '2')
  })

  it('should send an event to a process', function (done) {
    guvnor.once('process:ready', function (processInfo) {
      guvnor.once('custom:event:received', function (processInfo, one, two, three) {
        expect(one).to.equal('one')
        expect(two).to.equal('two')
        expect(three).to.equal('three')

        done()
      })

      runCli('send', 'receive-event.js', 'custom:event:sent', 'one', 'two', 'three', '-v')
    })

    runCli('start', __dirname + '/fixtures/receive-event.js')
  })

  it('should make a process dump heap', function (done) {
    guvnor.once('process:ready', function () {
      console.info = function (string) {
        expect(string).to.contain('Written heap dump to')

        done()
      }

      runCli('heapdump', 'hello-world.js')
    })

    runCli('start', __dirname + '/fixtures/hello-world.js')
  })

  it('should make a process collect garbage', function (done) {
    guvnor.once('process:ready', function (processInfo) {
      processInfo.on('process:gc:complete', done)

      runCli('gc', 'hello-world.js')
    })

    runCli('start', __dirname + '/fixtures/hello-world.js')
  })

  it('should send a signal to a process', function (done) {
    guvnor.once('process:ready', function () {
      guvnor.once('signal:received', function (proc, signal) {
        expect(signal).to.equal('SIGWINCH')

        done()
      })

      runCli('signal', 'siglisten.js', 'SIGWINCH')
    })

    runCli('start', __dirname + '/fixtures/siglisten.js')
  })

  it('should write to a processes stdin', function (done) {
    guvnor.once('process:ready', function () {
      guvnor.once('stdin:received', function (proc, string) {
        expect(string).to.equal('hello world')

        done()
      })

      runCli('write', 'stdin.js', 'hello world')
    })

    runCli('start', __dirname + '/fixtures/stdin.js')
  })

  it('should show logs', function (done) {
    console.info = function () {
      var string = util.format.apply(util, arguments)

      expect(string).to.contain('hello world')

      done()
    }

    guvnor.once('process:ready', function () {
      runCli('logs')
    })

    runCli('start', __dirname + '/fixtures/hello-world.js')
  })

  it('should only show logs for one process', function (done) {
    async.series([
      function (callback) {
        guvnor.once('process:ready', function () {
          callback()
        })

        runCli('start', __dirname + '/fixtures/hello-world.js')
      },
      function (callback) {
        guvnor.once('process:ready', function () {
          callback()
        })

        runCli('start', __dirname + '/fixtures/jibberjabber.js')
      }
    ], function (error) {
      if (error) {
        throw error
      }

      var logsReceived = 0

      console.info = function () {
        var string = util.format.apply(util, arguments)

        expect(string).to.contain('hello world')

        logsReceived++

        if (logsReceived == 5) {
          done()
        }
      }

      runCli('logs', 'hello-world.js')
    })
  })

  it('should stop the daemon', function (done) {
    console.info = function (string) {
      expect(string).to.contain('Daemon is not running')

      done()
    }

    guvnor.once('daemon:exit', function () {
      runCli('status')
    })

    runCli('kill')
  })

  it('should dump processes', function (done) {
    guvnor.once('process:ready', function () {
      guvnor.once('daemon:dump', function () {
        var contents

        try {
          contents = fs.readFileSync(config.guvnor.confdir + '/processes.json')
        } catch (e) {
          return done(e)
        }

        var processes = JSON.parse(contents)

        expect(processes[0].script).to.equal(__dirname + '/fixtures/hello-world.js')

        done()
      })

      runCli('dump')
    })

    runCli('start', __dirname + '/fixtures/hello-world.js')
  })

  it('should restore processes', function (done) {
    var processes = [{
      script: __dirname + '/fixtures/hello-world.js'
    }]

    fs.writeFileSync(config.guvnor.confdir + '/processes.json', JSON.stringify(processes))

    guvnor.once('process:ready', function (managedProcess) {
      expect(managedProcess.script).to.equal(__dirname + '/fixtures/hello-world.js')

      done()
    })

    runCli('restore')
  })

  it('should print config options', function (done) {
    console.info = function (string) {
      expect(string).to.equal(config.guvnor.rundir)

      done()
    }

    runCli('config', 'guvnor.rundir')
  })

  it('should report daemon status', function (done) {
    console.info = function (string) {
      expect(string).to.contain('Daemon is running')

      done()
    }

    runCli('status')
  })

  it('should print config for the web monitor', function (done) {
    var output = ''
    var lines = 0

    console.info = function () {
      output += util.format.apply(util, arguments) + '\n'

      lines++

      if (lines === 9) {
        expect(output).to.contain('host =')
        expect(output).to.contain('port =')
        expect(output).to.contain('user =')
        expect(output).to.contain('secret =')

        done()
      }
    }

    runCli('remoteconfig')
  })

  it('should list users for the web monitor', function (done) {
    console.info = function () {
      var output = util.format.apply(util, arguments) + '\n'

      expect(output).to.contain(user.name)

      done()
    }

    runCli('lsusers')
  })

  it('should reset users password for the web monitor', function (done) {
    var output = ''
    var lines = 0

    console.info = function () {
      output += util.format.apply(util, arguments) + '\n'

      lines++

      if (lines === 6) {
        var contents

        try {
          contents = fs.readFileSync(config.guvnor.confdir + '/users.json')
        } catch (e) {
          return done(e)
        }

        var users = JSON.parse(contents)

        expect(output).to.contain('[' + user.name)
        expect(output).to.contain('secret = ' + users[0].secret)

        done()
      }
    }

    runCli('reset', user.name)
  })

  it('should generate ssl certificates', function (done) {
    guvnor.on('daemon:genssl', function () {
      expect(fs.existsSync(config.guvnor.confdir + '/rpc.cert')).to.be.true
      expect(fs.existsSync(config.guvnor.confdir + '/rpc.key')).to.be.true

      // should have updated config file
      var contents

      try {
        contents = fs.readFileSync(config.guvnor.confdir + '/guvnor', 'utf8')
      } catch (e) {
        return done(e)
      }

      var rc = ini.parse(contents)

      expect(rc.remote.key).to.equal(config.guvnor.confdir + '/rpc.key')
      expect(rc.remote.certificate).to.equal(config.guvnor.confdir + '/rpc.cert')

      done()
    })

    expect(fs.existsSync(config.guvnor.confdir + '/rpc.cert')).to.be.false
    expect(fs.existsSync(config.guvnor.confdir + '/rpc.key')).to.be.false

    runCli('genssl')
  })

  it('should deploy an application', function (done) {
    var appName = 'foo'
    var repo = tmpdir + '/' + shortid.generate() + '/' + appName

    async.series([
      exec.bind(null, 'mkdir', ['-p', repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      function (callback) {
        fs.writeFile(repo + '/package.json', JSON.stringify({
          name: appName
        }), callback)
      },
      exec.bind(null, 'touch', ['index.js'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
    ], function (error) {
      if (error) {
        throw error
      }

      guvnor.on('app:installed', function (appInfo) {
        expect(appInfo.name).to.equal(appName)
        expect(fs.existsSync(appInfo.url)).to.be.true
        expect(appInfo.user).to.equal(user.name)

        done()
      })

      runCli('install', repo)
    })
  })

  it('should deploy an application and override name', function (done) {
    var appName = 'foo'
    var repo = tmpdir + '/' + shortid.generate() + '/' + appName

    async.series([
      exec.bind(null, 'mkdir', ['-p', repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      function (callback) {
        fs.writeFile(repo + '/package.json', JSON.stringify({
          name: 'not' + appName
        }), callback)
      },
      exec.bind(null, 'touch', ['index.js'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
    ], function (error) {
      if (error) {
        throw error
      }

      guvnor.on('app:installed', function (appInfo) {
        expect(appInfo.name).to.equal(appName)
        expect(fs.existsSync(appInfo.url)).to.be.true
        expect(appInfo.user).to.equal(user.name)

        done()
      })

      runCli('install', repo, appName)
    })
  })

  it('should list deployed applications', function (done) {
    var deployApp = function (callback) {
      var repo = tmpdir + '/' + shortid.generate()

      async.series([
        exec.bind(null, 'mkdir', [repo]),
        exec.bind(null, 'git', ['init'], repo),
        exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
        exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
        exec.bind(null, 'touch', ['file'], repo),
        exec.bind(null, 'git', ['add', '-A'], repo),
        exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
      ], function (error) {
        if (error) {
          throw error
        }

        var appName = shortid.generate()

        guvnor.deployApplication(appName, repo, user.name, console.info, console.error, callback)
      })
    }

    var tasks = [deployApp, deployApp, deployApp, deployApp, deployApp]

    async.parallel(tasks, function (error) {
      expect(error).to.not.exist

      var output = ''
      var lines = 0

      console.info = function () {
        output += util.format.apply(util, arguments) + '\n'

        lines++

        if (lines === 6) {
          guvnor.listApplications(function (error, apps) {
            expect(error).to.not.exist

            apps.forEach(function (app) {
              expect(output).to.contain(app.name)
              expect(output).to.contain(app.user)
              expect(output).to.contain(app.url)
            })

            done()
          })
        }
      }

      runCli('lsapps')
    })
  })

  it('should remove deployed applications', function (done) {
    var repo = tmpdir + '/' + shortid.generate()

    async.series([
      exec.bind(null, 'mkdir', [repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      exec.bind(null, 'touch', ['file'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
    ], function (error) {
      if (error) {
        throw error
      }

      var appName = shortid.generate()

      guvnor.deployApplication(appName, repo, user.name, console.info, console.error, function (error, appInfo) {
        expect(error).to.not.exist
        expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id)).to.be.true

        guvnor.listApplications(function (error, apps) {
          expect(error).to.not.exist
          expect(apps.length).to.equal(1)

          guvnor.on('app:removed', function (appInfo) {
            expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id)).to.be.false

            guvnor.listApplications(function (error, apps) {
              expect(error).to.not.exist
              expect(apps.length).to.equal(0)

              done()
            })
          })

          runCli('rmapp', appInfo.name)
        })
      })
    })
  })

  it('should switch an application ref', function (done) {
    var repo = tmpdir + '/' + shortid.generate()

    async.series([
      exec.bind(null, 'mkdir', [repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      exec.bind(null, 'touch', ['v1'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'v1'], repo),
      exec.bind(null, 'git', ['tag', 'v1'], repo),
      exec.bind(null, 'touch', ['v2'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'v2'], repo),
      exec.bind(null, 'git', ['tag', 'v2'], repo),
      exec.bind(null, 'touch', ['v3'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'v3'], repo),
      exec.bind(null, 'git', ['tag', 'v3'], repo)
    ], function (error) {
      if (error) {
        throw error
      }

      var appName = shortid.generate()

      guvnor.deployApplication(appName, repo, user.name, console.info, console.error, function (error, appInfo) {
        expect(error).to.not.exist

        // should be at latest version
        expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v1')).to.be.true
        expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v2')).to.be.true
        expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v3')).to.be.true

        guvnor.on('app:refs:switched', function (error, switchedAppInfo, previousRef, newRef) {
          expect(error).not.to.exist
          expect(switchedAppInfo.id).to.equal(appInfo.id)
          expect(previousRef).to.equal('refs/heads/master')
          expect(newRef).to.equal('tags/v2')

          done()
        })

        runCli('setref', appInfo.name, 'tags/v2')
      })
    })
  })

  it('should list available application refs', function (done) {
    var repo = tmpdir + '/' + shortid.generate()

    async.series([
      exec.bind(null, 'mkdir', [repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      exec.bind(null, 'touch', ['v1'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'v1'], repo),
      exec.bind(null, 'git', ['tag', 'v1'], repo),
      exec.bind(null, 'touch', ['v2'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'v2'], repo),
      exec.bind(null, 'git', ['tag', 'v2'], repo),
      exec.bind(null, 'touch', ['v3'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'v3'], repo),
      exec.bind(null, 'git', ['tag', 'v3'], repo)
    ], function (error) {
      if (error) {
        throw error
      }

      var appName = shortid.generate()

      guvnor.deployApplication(appName, repo, user.name, console.info, console.error, function (error, appInfo) {
        expect(error).to.not.exist
        expect(appInfo.id).to.be.ok

        var output = ''
        var lines = 0

        console.info = function () {
          output += util.format.apply(util, arguments) + '\n'

          lines++

          if (lines === 7) {
            expect(output).to.contain('refs/heads/master')
            expect(output).to.contain('refs/remotes/origin/HEAD')
            expect(output).to.contain('refs/remotes/origin/master')
            expect(output).to.contain('refs/tags/v1')
            expect(output).to.contain('refs/tags/v2')
            expect(output).to.contain('refs/tags/v3')

            done()
          }
        }

        runCli('lsrefs', appInfo.name, 'tags/v2')
      })
    })
  })

  it('should update application refs', function (done) {
    var repo = tmpdir + '/' + shortid.generate()

    async.series([
      exec.bind(null, 'mkdir', [repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      exec.bind(null, 'touch', ['v1'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'v1'], repo),
      exec.bind(null, 'git', ['tag', 'v1'], repo)
    ], function (error) {
      if (error)
        throw error

      var appName = shortid.generate()

      guvnor.deployApplication(appName, repo, user.name, console.info, console.error, function (error, appInfo) {
        expect(error).to.not.exist
        expect(appInfo.id).to.be.ok

        guvnor.listApplicationRefs(appName, function (error, refs) {
          expect(error).to.not.exist

          expect(refs.length).to.equal(4)

          async.series([
            exec.bind(null, 'touch', ['v2'], repo),
            exec.bind(null, 'git', ['add', '-A'], repo),
            exec.bind(null, 'git', ['commit', '-m', 'v2'], repo),
            exec.bind(null, 'git', ['tag', 'v2'], repo),
            exec.bind(null, 'touch', ['v3'], repo),
            exec.bind(null, 'git', ['add', '-A'], repo),
            exec.bind(null, 'git', ['commit', '-m', 'v3'], repo),
            exec.bind(null, 'git', ['tag', 'v3'], repo)
          ], function (error) {
            if (error)
              throw error

            guvnor.listApplicationRefs(appName, function (error, refs) {
              expect(error).to.not.exist

              expect(refs.length).to.equal(4)

              guvnor.on('app:refs:updated', function (error, updatedRefAppInfo, refs) {
                expect(error).not.to.exist
                expect(updatedRefAppInfo.id).to.equal(appInfo.id)
                expect(refs.length).to.equal(6)

                done()
              })

              runCli('updaterefs', appInfo.name)
            })
          })
        })
      })
    })
  })

  it('should start an app', function (done) {
    var appName = 'foo'
    var repo = tmpdir + '/' + shortid.generate() + '/' + appName

    async.series([
      exec.bind(null, 'mkdir', ['-p', repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      function (callback) {
        fs.writeFile(repo + '/package.json', JSON.stringify({
          name: appName
        }), callback)
      },
      function (callback) {
        fs.writeFile(repo + '/index.js', 'setInterval(function () { console.log("hello world") }, 1000)', callback)
      },
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
    ], function (error) {
      if (error) {
        throw error
      }

      guvnor.deployApplication(appName, repo, user.name, console.info, console.error, function (error, appInfo) {
        expect(error).to.not.exist

        guvnor.on('process:ready', function (managedProcess) {
          expect(managedProcess.name).to.equal(appInfo.name)

          done()
        })

        runCli('start', appInfo.name)
      })
    })
  })
})
