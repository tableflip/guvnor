var expect = require('chai').expect,
  posix = require('posix'),
  shortid = require('shortid'),
  os = require('os'),
  fs = require('fs'),
  connect = require('../../lib/local').connect

var user = posix.getpwnam(process.getuid())
var group = posix.getgrnam(process.getgid())

var config = {
  boss: {
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

var boss

describe('BossResume', function() {
  // integration tests are slow
  this.timeout(60000)

  it('should autoresume processes when restarted', function(done) {
    var conf = JSON.parse(JSON.stringify(config))

    var id = shortid.generate()
    conf.boss.logdir = (os.tmpdir() + '/' + id + '/logs').replace(/\/\//g, '/')
    conf.boss.rundir = (os.tmpdir() + '/' + id + '/run').replace(/\/\//g, '/')
    conf.boss.confdir = (os.tmpdir() + '/' + id + '/conf').replace(/\/\//g, '/')
    conf.boss.appdir = (os.tmpdir() + '/' + id + '/apps').replace(/\/\//g, '/')
    conf.boss.autoresume = true

    connect(conf, logger, function (error, boss) {
      if (error) throw error

      boss.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
        expect(error).to.not.exist
        expect(processInfo.id).to.be.ok

        boss.once('process:ready', function (readyProcessInfo) {
          if (readyProcessInfo.id != processInfo.id) {
            return
          }

          expect(readyProcessInfo.socket).to.include(readyProcessInfo.pid)

          // should not have created the processes dump file yet
          expect(fs.existsSync(conf.boss.confdir + '/processes.json')).to.be.false

          boss.kill(function () {
            boss.disconnect(function () {
              // now should have created the processes dump file
              expect(fs.existsSync(conf.boss.confdir + '/processes.json')).to.be.true

              setTimeout(function () {

                connect(conf, logger, function (error, boss) {
                  if (error) throw error

                  boss.listProcesses(function (error, processes) {
                    expect(error).to.not.exist
                    expect(processes.length).to.equal(1)

                    boss.kill(function () {
                      boss.disconnect(function () {
                        done()
                      })
                    })
                  })
                })
              }, 1000)
            })
          })
        })
      })
    })
  })
})
