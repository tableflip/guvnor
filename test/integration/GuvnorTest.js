var expect = require('chai').expect,
  posix = require('posix'),
  shortid = require('shortid'),
  os = require('os'),
  continueProcess = require('./fixtures/continueProcess'),
  fs = require('fs'),
  async = require('async'),
  exec = require('./fixtures/exec'),
  child_process = require('child_process')

var user = posix.getpwnam(process.getuid())
var group = posix.getgrnam(process.getgid())

var config = {
  guvnor: {
    user: user.name,
    group: group.name,
    timeout: 5000,
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
  info: console.info,
  warn: console.info,
  error: console.info,
  debug: console.info
}

var remote = require('../../lib/local').connectOrStart,
  remote = remote.bind(null, config, logger)

var guvnor
var tmpdir

describe('Guvnor', function () {
  // integration tests are slow
  this.timeout(60000)

  beforeEach(function (done) {
    tmpdir = os.tmpdir() + '/' + shortid.generate()
    tmpdir = tmpdir.replace(/\/\//g, '/')

    config.guvnor.logdir = tmpdir + '/logs'
    config.guvnor.rundir = tmpdir + '/run'
    config.guvnor.confdir = tmpdir + '/conf'
    config.guvnor.appdir = tmpdir + '/apps'

    remote(function (error, b) {
      if (error)
        throw error

      guvnor = b

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

        console.info(type)
      })
      guvnor.on('daemon:log:*', function (type, event) {
        console.info(type, event.message)
      })
      guvnor.on('process:log:*', function (type, processInfo, event) {
        console.info(type, event)
      })
      guvnor.on('cluster:log:*', function (type, processInfo, event) {
        console.info(type, event)
      })
      guvnor.on('worker:log:*', function (type, clusterInfo, processInfo, event) {
        console.info(type, event)
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
    guvnor.callbacks = {}
    guvnor.kill(guvnor.disconnect.bind(guvnor, done))
  })

  it('should have npm available', function (done) {
    child_process.exec('which npm', function (error, stdout, stderr) {
      console.info('which npm')
      console.info('error', error)
      console.info('stdout', stdout)
      console.info('stderr', stderr)

      done()
    })
  })

  it('should have git available', function (done) {
    child_process.exec('which git', function (error, stdout, stderr) {
      console.info('which git')
      console.info('error', error)
      console.info('stdout', stdout)
      console.info('stderr', stderr)

      done()
    })
  })

  it('should start a process', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      console.info('process id', processInfo.id)

      processInfo.once('process:ready', function () {
        expect(processInfo.socket).to.include(processInfo.pid)

        done()
      })
    })
  })

  it('should start a coffeescript process', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.coffee', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      guvnor.once('process:ready', function (readyProcessInfo) {
        if (readyProcessInfo.id != processInfo.id) {
          return
        }

        expect(readyProcessInfo.socket).to.include(readyProcessInfo.pid)

        done()
      })
    })
  })

  it('should survive starting a process with the wrong group name', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {
      group: shortid.generate()
    }, function (error) {
      expect(error).to.be.ok
      expect(error.message).to.contain('group')

      done()
    })
  })

  it('should survive starting a process with the wrong user name', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {
      user: shortid.generate()
    }, function (error) {
      expect(error).to.be.ok
      expect(error.message).to.contain('user')

      done()
    })
  })

  it('should start a process in debug mode', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {
      debug: true
    }, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok
      expect(processInfo.status).to.equal('paused')
      expect(processInfo.debugPort).to.be.a('number')

      var continued = false

      processInfo.on('process:ready', function () {
        expect(processInfo.socket).to.include(processInfo.pid)
        expect(continued).to.be.true

        done()
      })

      continueProcess(processInfo.debugPort, function (error) {
        expect(error).to.not.exist

        continued = true
      })
    })
  })

  it('should stop a process', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.once('process:exit', function (error, code, signal) {
        expect(processInfo.status).to.equal('stopped')
        expect(error).to.not.exist
        expect(code).to.equal(0)
        expect(signal).to.not.exist

        console.info('process exited')

        guvnor.listProcesses(function (error, processes) {
          expect(error).to.not.exist
          expect(processes.length).to.equal(1)
          expect(processes[0].id).to.equal(processInfo.id)
          expect(processes[0].status).to.equal('stopped')

          done()
        })
      })

      processInfo.once('process:ready', function () {
        expect(processInfo.socket).to.be.ok

        processInfo.kill()
      })
    })
  })

  it('should restart a process', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      var notifiedOfRestarting = false

      processInfo.once('process:restarting', function () {
        notifiedOfRestarting = true
      })

      processInfo.once('process:restarted', function () {
        guvnor.listProcesses(function (error, processes) {
          console.info(error, processes)
          expect(error).to.not.exist
          expect(notifiedOfRestarting).to.be.true
          expect(processes.length).to.equal(1)
          expect(processes[0].restarts).to.equal(1)

          done()
        })
      })

      processInfo.once('process:ready', function () {
        expect(processInfo.socket).to.be.ok

        processInfo.restart()
      })
    })
  })

  it('should list processes', function (done) {
    guvnor.listProcesses(function (error, processes) {
      expect(error).to.not.exist
      expect(processes.length).to.equal(0)

      guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
        expect(error).to.not.exist
        expect(processInfo.id).to.be.ok

        guvnor.once('process:ready', function () {
          guvnor.listProcesses(function (error, processes) {
            expect(error).to.not.exist
            expect(processes.length).to.equal(1)

            done()
          })
        })
      })
    })
  })

  it('should restart a failing process', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/crash-on-message.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.once('process:restarted', function (failedPid) {
        expect(processInfo.pid).to.not.equal(failedPid)

        done()
      })

      processInfo.once('process:ready', function () {
        expect(processInfo.socket).to.be.ok

        processInfo.send('custom:euthanise')
      })
    })
  })

  it('should abort a constantly failing process', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/first-tick-crash.js', {}, function (error, processInfo) {
      expect(error).to.not.exist

      processInfo.once('process:aborted', function () {

        // should have status of 'aborted'
        guvnor.listProcesses(function (error, processes) {
          expect(error).to.not.exist
          expect(processes.length).to.equal(1)
          expect(processes[0].id).to.equal(processInfo.id)
          expect(processes[0].status).to.equal('aborted')

          done()
        })
      })
    })
  })

  it('should invoke a remote callback', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/remote-executor.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.once('process:ready', function () {
        expect(processInfo.socket).to.be.ok

        processInfo.send('custom:hello', function (message) {
          expect(message).to.equal('hello world')

          done()
        })
      })
    })
  })

  it('should start cluster and report online when all processes have started', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/http-server.js', {
      env: {
        PORT: 0
      },
      instances: 2
    }, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      var workersForked = 0
      var workersStarting = 0
      var workersStarted = 0
      var workersReady = 0

      processInfo.on('worker:forked', function (workerProcessInfo) {
        expect(workerProcessInfo).to.be.ok

        workersForked++
      })

      processInfo.on('worker:starting', function (workerProcessInfo) {
        expect(workerProcessInfo).to.be.ok

        workersStarting++
      })

      processInfo.on('worker:started', function (workerProcessInfo) {
        expect(workerProcessInfo).to.be.ok

        workersStarted++
      })

      processInfo.on('worker:ready', function (workerProcessInfo) {
        expect(workerProcessInfo).to.be.ok

        workersReady++
      })

      processInfo.once('cluster:online', function () {
        expect(workersForked).to.equal(2)
        expect(workersStarting).to.equal(2)
        expect(workersStarted).to.equal(2)
        expect(workersReady).to.equal(2)

        done()
      })
    })
  })

  it('should report status for cluster workers', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/http-server.js', {
      env: {
        PORT: 0
      },
      instances: 2
    }, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      var debugPort = processInfo.debugPort

      processInfo.once('cluster:online', function () {
        guvnor.listProcesses(function (error, processes) {
          expect(error).to.not.exist
          expect(processes.length).to.equal(1)

          expect(processes[0].workers.length).to.equal(2)

          expect(processes[0].workers[0].title).to.equal(processes[0].workers[1].title)
          expect(processes[0].workers[0].pid).to.not.equal(processes[0].workers[1].pid)

          // should have assigned sequential debug ports
          expect(processes[0].workers[0].debugPort).to.equal(debugPort + 1)
          expect(processes[0].workers[1].debugPort).to.equal(debugPort + 2)

          done()
        })
      })
    })
  })

  it('should reduce number of cluster workers', function (done) {
    var instances = 3

    guvnor.startProcess(__dirname + '/fixtures/http-server.js', {
      env: {
        PORT: 0
      },
      instances: instances
    }, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.once('cluster:online', function () {
        instances--

        processInfo.setClusterWorkers(instances, function (error) {
          expect(error).to.not.exist

          guvnor.listProcesses(function (error, processes) {
            expect(error).to.not.exist
            expect(processes.length).to.equal(1)
            expect(processes[0].workers.length).to.equal(instances)

            guvnor.findProcessInfoById(processInfo.id, function (error, processInfo) {
              expect(error).to.not.exist
              expect(processInfo.instances).to.equal(instances)

              done()
            })
          })
        })
      })
    })
  })

  it('should increase number of cluster workers', function (done) {
    var instances = 2

    guvnor.startProcess(__dirname + '/fixtures/http-server.js', {
      env: {
        PORT: 0
      },
      instances: instances,
      debug: true
    }, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.once('cluster:online', function () {
        instances++

        processInfo.setClusterWorkers(instances, function (error) {
          expect(error).to.not.exist

          guvnor.once('cluster:online', function (clusterProcessInfo) {
            if (clusterProcessInfo.id != processInfo.id) {
              return
            }

            guvnor.listProcesses(function (error, processes) {
              expect(error).to.not.exist
              expect(processes.length).to.equal(1)
              expect(processes[0].workers.length).to.equal(instances)

              guvnor.findProcessInfoById(processInfo.id, function (error, processInfo) {
                expect(error).to.not.exist
                expect(processInfo.instances).to.equal(instances)

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should dump process info', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.once('process:ready', function () {
        expect(processInfo.socket).to.include(processInfo.pid)

        guvnor.dumpProcesses(function (error) {
          expect(error).to.not.exist
          expect(fs.existsSync(config.guvnor.confdir + '/processes.json')).to.be.true

          done()
        })
      })
    })
  })

  it('should restore process info', function (done) {
    fs.writeFileSync(
      config.guvnor.confdir + '/processes.json',
      '[{"script": "' + __dirname + '/fixtures/hello-world.js' + '", "name": "super-fun"}]'
    )

    guvnor.listProcesses(function (error, processes) {
      expect(error).to.not.exist
      expect(processes.length).to.equal(0)

      guvnor.restoreProcesses(function (error) {
        expect(error).to.not.exist

        guvnor.listProcesses(function (error, processes) {
          expect(processes.length).to.equal(1)
          done()
        })
      })
    })
  })

  it('should make a process do a heap dump', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.on('process:ready', function () {
        expect(processInfo.socket).to.be.ok

        async.parallel([function (callback) {
          processInfo.on('process:heapdump:start', callback)
        }, function (callback) {
          processInfo.on('process:heapdump:complete', callback)
        }, function (callback) {
          processInfo.dumpHeap(function (error, path) {
            expect(error).to.not.exist
            expect(fs.existsSync(path)).to.be.true

            // tidy up dump file
            fs.unlinkSync(path)

            processInfo.kill()

            callback()
          })
        }
        ], done)
      })
    })
  })

  it('should force a process to garbage collect', function (done) {
    guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.on('process:ready', function () {
        expect(processInfo.socket, 'socket was missing').to.be.ok

        async.parallel([function (callback) {
          processInfo.on('process:gc:start', callback)
        }, function (callback) {
          processInfo.on('process:gc:complete', callback)
        }, function (callback) {
          processInfo.forceGc(function (error) {
            expect(error, 'could not perform gc').to.not.exist

            processInfo.kill()

            callback()
          })
        }
        ], done)
      })
    })
  })

  it('should deploy an application', function (done) {
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

        done()
      })
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

    async.parallel(tasks, function (error, results) {
      expect(error).to.not.exist

      guvnor.listApplications(function (error, apps) {
        expect(error).to.not.exist
        expect(apps.length).to.equal(tasks.length)

        var found = 0

        results.forEach(function (result) {
          apps.forEach(function (app) {
            if (result.id == app.id) {
              found++
            }
          })
        })

        expect(found).to.equal(tasks.length)

        done()
      })
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

          guvnor.removeApplication(appName, function (error) {
            expect(error).to.not.exist
            expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id)).to.be.false

            guvnor.listApplications(function (error, apps) {
              expect(error).to.not.exist
              expect(apps.length).to.equal(0)

              done()
            })
          })
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

        guvnor.switchApplicationRef(appName, 'tags/v2', console.info, console.error, function (error) {
          expect(error).to.not.exist

          // now at v2
          expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v1')).to.be.true
          expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v2')).to.be.true
          expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v3')).to.be.false

          guvnor.switchApplicationRef(appName, 'tags/v1', console.info, console.error, function (error) {
            expect(error).to.not.exist

            // now at v1
            expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v1')).to.be.true
            expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v2')).to.be.false
            expect(fs.existsSync(config.guvnor.appdir + '/' + appInfo.id + '/v3')).to.be.false

            done()
          })
        })
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

        guvnor.listApplicationRefs(appName, function (error, refs) {
          expect(error).to.not.exist

          expect(refs.length).to.equal(6)

          expect(refs[0].name).to.equal('refs/heads/master')
          expect(refs[1].name).to.equal('refs/remotes/origin/HEAD')
          expect(refs[2].name).to.equal('refs/remotes/origin/master')
          expect(refs[3].name).to.equal('refs/tags/v1')
          expect(refs[4].name).to.equal('refs/tags/v2')
          expect(refs[5].name).to.equal('refs/tags/v3')

          done()
        })
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
      if (error) {
        throw error
      }

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

              guvnor.updateApplicationRefs(appName, console.info, console.error, function (error) {
                expect(error).to.not.exist

                guvnor.listApplicationRefs(appName, function (error, refs) {
                  expect(error).to.not.exist

                  expect(refs.length).to.equal(6)

                  done()
                })
              })
            })
          })
        })
      })
    })
  })

  it('should write to a processes stdin', function (done) {
    var message = 'hello world'

    guvnor.on('stdin:received', function (processInfo, answer) {
      expect(answer).to.equal(message)

      done()
    })

    guvnor.startProcess(__dirname + '/fixtures/stdin.js', {}, function (error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      processInfo.on('process:ready', function () {
        processInfo.write(message)
      })
    })
  })
})
