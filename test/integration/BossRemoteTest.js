var expect = require('chai').expect,
  posix = require('posix'),
  shortid = require('shortid'),
  freeport = require('freeport'),
  os = require('os'),
  fs = require('fs'),
  async = require('async'),
  exec = require('./fixtures/exec')

var user = posix.getpwnam(process.getuid())
var group = posix.getgrnam(process.getgid())

var config = {
  boss: {
    user: user.name,
    group: group.name,
    timeout: 5000,
    autoresume: false
  },
  remote: {
    enabled: true,

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

var local = require('../../lib/local').connect,
  local = local.bind(null, config, logger)

var remote = require('../../lib/remote')

describe('BossRemote', function() {
  // integration tests are slow
  this.timeout(0)

  var localBoss, remoteBoss, tmpdir

  beforeEach(function(done) {
    tmpdir = os.tmpdir() + '/' + shortid.generate()
    tmpdir = tmpdir.replace(/\/\//g, '/')

    config.boss.logdir = tmpdir + '/logs'
    config.boss.rundir = tmpdir + '/run'
    config.boss.confdir = tmpdir + '/conf'
    config.boss.appdir = tmpdir + '/apps'

    // find a port to start the remote rpc server on
    freeport(function(error, port) {
      if (error) throw error

      // set it in the config
      config.remote.port = port

      // start local boss daemon
      local(function(error, b) {
        if (error) throw error

        localBoss = b

        // log all received events
        localBoss.on('*', function(type) {
          if (type.substring(0, 'boss:log'.length) == 'boss:log' ||
            type.substring(0, 'process:uncaughtexception'.length) == 'process:uncaughtexception' ||
            type.substring(0, 'boss:fatality'.length) == 'boss:fatality' ||
            type.substring(0, 'process:log'.length) == 'process:log') {
            // already handled
            return
          }

          console.info('LOCAL', type)
        })
        localBoss.on('boss:log:*', function(type, event) {
          console.info('LOCAL', type, event.message)
        })
        localBoss.on('process:log:*', function(type, processId, event) {
          console.info('LOCAL', type, event)
        })
        localBoss.on('process:uncaughtexception:*', function(type, error) {
          console.log('LOCAL', error.stack)
        })
        localBoss.on('boss:fatality', function(error) {
          console.log('LOCAL', error.stack)
        })

        // find the admin users's secret
        localBoss.listRemoteUsers(function(error, users) {
          if (error) throw error

          var user

          users.forEach(function(u) {
            if(u.name == config.boss.user) {
              user = u
            }
          })

          // connect to the remote rpc port as the admin user
          remote(logger, {
            user: config.boss.user,
            secret: user.secret,
            host: 'localhost',
            port: port
          }, function(error, b) {
            if (error) throw error

            remoteBoss = b

            // log all received events
            remoteBoss.on('*', function(type) {
              if (type.substring(0, 'boss:log'.length) == 'boss:log' ||
                type.substring(0, 'process:uncaughtexception'.length) == 'process:uncaughtexception' ||
                type.substring(0, 'boss:fatality'.length) == 'boss:fatality' ||
                type.substring(0, 'process:log'.length) == 'process:log') {
                // already handled
                return
              }

              console.info('REMOTE', type)
            })
            remoteBoss.on('boss:log:*', function(type, event) {
              console.info('REMOTE', type, event.message)
            })
            remoteBoss.on('process:log:*', function(type, processId, event) {
              console.info('REMOTE', type, event)
            })
            remoteBoss.on('process:uncaughtexception:*', function(type, error) {
              console.log('REMOTE', error.stack)
            })
            remoteBoss.on('boss:fatality', function(error) {
              console.log('REMOTE', error.stack)
            })

            done()
          })
        })
      })
    })
  })

  afterEach(function(done) {
    localBoss.callbacks = {}

    remoteBoss.disconnect(
      localBoss.kill.bind(localBoss,
        localBoss.disconnect.bind(localBoss,
          done
        )
      )
    )
  })

  it('should list processes', function(done) {
    remoteBoss.listProcesses(function(error, processes) {
      expect(error).to.not.exist
      expect(processes.length).to.equal(0)

      localBoss.startProcess(__dirname + '/fixtures/hello-world.js', {}, function(error, processInfo) {
        expect(error).to.not.exist
        expect(processInfo.id).to.be.ok

        localBoss.on('process:ready', function() {
          remoteBoss.listProcesses(function(error, processes) {
            expect(error).to.not.exist
            expect(processes.length).to.equal(1)

            done()
          })
        })
      })
    })
  })

  it('should find process info by id', function(done) {
    remoteBoss.listProcesses(function(error, processes) {
      expect(error).to.not.exist
      expect(processes.length).to.equal(0)

      localBoss.startProcess(__dirname + '/fixtures/hello-world.js', {}, function(error, processInfo) {
        expect(error).to.not.exist
        expect(processInfo.id).to.be.ok

        localBoss.on('process:ready', function(processInfo) {
          remoteBoss.findProcessInfoById(processInfo.id, function(error, returnedProcessInfo) {
            expect(error).to.not.exist
            expect(returnedProcessInfo.id).to.equal(processInfo.id)

            done()
          })
        })
      })
    })
  })

  it('should get server status', function(done) {
    remoteBoss.getServerStatus(function(error, status) {
      expect(error).to.not.exist
      expect(status.time).to.be.a('number')
      expect(status.uptime).to.be.a('number')
      expect(status.freeMemory).to.be.a('number')
      expect(status.totalMemory).to.be.a('number')
      // etc

      done()
    })
  })

  it('should get server details', function(done) {
    remoteBoss.getDetails(function(error, details) {
      expect(error).to.not.exist
      expect(details.hostname).to.be.a('string')
      expect(details.type).to.be.a('string')
      expect(details.platform).to.be.a('string')
      expect(details.arch).to.be.a('string')
      expect(details.release).to.be.a('string')
      expect(details.version).to.be.a('string')
      // etc

      done()
    })
  })

  it('should connect to a remote process', function(done) {
    localBoss.startProcess(__dirname + '/fixtures/hello-world.js', {}, function(error, processInfo) {
      expect(error).to.not.exist
      expect(processInfo.id).to.be.ok

      localBoss.on('process:ready', function(processInfo) {

        remoteBoss.connectToProcess(processInfo.id, function(error, remote) {
          expect(error).to.not.exist
          expect(remote.kill).to.be.a('function')
          expect(remote.restart).to.be.a('function')
          expect(remote.send).to.be.a('function')
          expect(remote.reportStatus).to.be.a('function')
          expect(remote.dumpHeap).to.be.a('function')
          expect(remote.forceGc).to.be.a('function')

          remote.reportStatus(function(error, status) {
            expect(error).to.not.exist
            expect(status.pid).to.be.a('number')
            expect(status.uid).to.be.a('number')
            expect(status.gid).to.be.a('number')
            // etc

            done()
          })
        })
      })
    })
  })

  it('should deploy an application', function(done) {
    var repo = tmpdir + '/' + shortid.generate()

    async.series([
      exec.bind(null, 'mkdir', [repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      exec.bind(null, 'touch', ['file'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
    ], function(error) {
      if(error) throw error

      var appName = shortid.generate()

      remoteBoss.deployApplication(appName, repo, console.info, console.error, function(error, appInfo) {
        expect(error).to.not.exist
        expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id)).to.be.true

        done()
      })
    })
  })

  it('should list deployed applications', function(done) {
    var deployApp = function(callback) {
      var repo = tmpdir + '/' + shortid.generate()

      async.series([
        exec.bind(null, 'mkdir', [repo]),
        exec.bind(null, 'git', ['init'], repo),
        exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
        exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
        exec.bind(null, 'touch', ['file'], repo),
        exec.bind(null, 'git', ['add', '-A'], repo),
        exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
      ], function(error) {
        if(error) throw error

        var appName = shortid.generate()

        localBoss.deployApplication(appName, repo, user.name, console.info, console.error, callback)
      })
    }

    var tasks = [deployApp, deployApp, deployApp, deployApp, deployApp]

    async.parallel(tasks, function(error, results) {
      expect(error).to.not.exist

      remoteBoss.listApplications(function(error, apps) {
        expect(error).to.not.exist
        expect(apps.length).to.equal(tasks.length)

        var found = 0

        results.forEach(function(result) {
          apps.forEach(function(app) {
            if(result.id == app.id) {
              found++
            }
          })
        })

        expect(found).to.equal(tasks.length)

        done()
      })
    })
  })

  it('should remove deployed applications', function(done) {
    var repo = tmpdir + '/' + shortid.generate()

    async.series([
      exec.bind(null, 'mkdir', [repo]),
      exec.bind(null, 'git', ['init'], repo),
      exec.bind(null, 'git', ['config', 'user.email', 'foo@bar.com'], repo),
      exec.bind(null, 'git', ['config', 'user.name', 'foo'], repo),
      exec.bind(null, 'touch', ['file'], repo),
      exec.bind(null, 'git', ['add', '-A'], repo),
      exec.bind(null, 'git', ['commit', '-m', 'initial commit'], repo)
    ], function(error) {
      if(error) throw error

      var appName = shortid.generate()

      remoteBoss.deployApplication(appName, repo, console.info, console.error, function(error, appInfo) {
        expect(error).to.not.exist
        expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id)).to.be.true

        remoteBoss.listApplications(function(error, apps) {
          expect(error).to.not.exist
          expect(apps.length).to.equal(1)

          remoteBoss.removeApplication(appName, function(error) {
            expect(error).to.not.exist
            expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id)).to.be.false

            remoteBoss.listApplications(function(error, apps) {
              expect(error).to.not.exist
              expect(apps.length).to.equal(0)

              done()
            })
          })
        })
      })
    })
  })

  it('should switch an application ref', function(done) {
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
    ], function(error) {
      if(error) throw error

      var appName = shortid.generate()

      remoteBoss.deployApplication(appName, repo, console.info, console.error, function(error, appInfo) {
        expect(error).to.not.exist

        // should be at latest version
        expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v1')).to.be.true
        expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v2')).to.be.true
        expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v3')).to.be.true

        remoteBoss.switchApplicationRef(appName, 'tags/v2', console.info, console.error, function(error) {
          expect(error).to.not.exist

          // now at v2
          expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v1')).to.be.true
          expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v2')).to.be.true
          expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v3')).to.be.false

          remoteBoss.switchApplicationRef(appName, 'tags/v1', console.info, console.error, function(error) {
            expect(error).to.not.exist

            // now at v1
            expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v1')).to.be.true
            expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v2')).to.be.false
            expect(fs.existsSync(config.boss.appdir + '/' + appInfo.id + '/v3')).to.be.false

            done()
          })
        })
      })
    })
  })

  it('should list available application refs', function(done) {
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
    ], function(error) {
      if(error) throw error

      var appName = shortid.generate()

      remoteBoss.deployApplication(appName, repo, console.info, console.error, function(error, appInfo) {
        expect(error).to.not.exist
        expect(appInfo).to.be.ok

        remoteBoss.listApplicationRefs(appName, function(error, refs) {
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

  it('should update application refs', function(done) {
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
    ], function(error) {
      if(error) throw error

      var appName = shortid.generate()

      remoteBoss.deployApplication(appName, repo, console.info, console.error, function(error, appInfo) {
        expect(error).to.not.exist

        remoteBoss.listApplicationRefs(appName, function(error, refs) {
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
          ], function(error) {
            if(error) throw error

            remoteBoss.listApplicationRefs(appName, function(error, refs) {
              expect(error).to.not.exist

              expect(refs.length).to.equal(4)

              remoteBoss.updateApplicationRefs(appName, console.info, console.error, function(error) {
                expect(error).to.not.exist

                remoteBoss.listApplicationRefs(appName, function(error, refs) {
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
})
