var expect = require('chai').expect,
  posix = require('posix'),
  shortid = require('shortid'),
  os = require('os'),
  fs = require('fs'),
  connectOrStart = require('../../lib/local').connectOrStart

process.setMaxListeners(0)

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

var guvnor

describe('GuvnorResume', function () {
  // integration tests are slow
  this.timeout(60000)

  it('should autoresume processes when restarted', function (done) {
    var conf = JSON.parse(JSON.stringify(config))

    var id = shortid.generate()
    conf.guvnor.logdir = (os.tmpdir() + '/' + id + '/logs').replace(/\/\//g, '/')
    conf.guvnor.rundir = (os.tmpdir() + '/' + id + '/run').replace(/\/\//g, '/')
    conf.guvnor.confdir = (os.tmpdir() + '/' + id + '/conf').replace(/\/\//g, '/')
    conf.guvnor.appdir = (os.tmpdir() + '/' + id + '/apps').replace(/\/\//g, '/')
    conf.guvnor.autoresume = true

    connectOrStart(conf, logger, function (error, guvnor) {
      if (error)
        throw error

      guvnor.startProcess(__dirname + '/fixtures/hello-world.js', {}, function (error, processInfo) {
        expect(error).to.not.exist
        expect(processInfo.id).to.be.ok

        guvnor.once('process:ready', function (readyProcessInfo) {
          if (readyProcessInfo.id != processInfo.id) {
            return
          }

          expect(readyProcessInfo.socket).to.include(readyProcessInfo.pid)

          // should not have created the processes dump file yet
          expect(fs.existsSync(conf.guvnor.confdir + '/processes.json')).to.equal(false, 'processes.json existed when it shouldn\'t')

          guvnor.kill(function () {
            guvnor.disconnect(function () {
              setTimeout(function () {
                // now should have created the processes dump file
                expect(fs.existsSync(conf.guvnor.confdir + '/processes.json')).to.equal(true, 'processes.json not created')

                connectOrStart(conf, logger, function (error, guvnor) {
                  if (error)
                    throw error

                  guvnor.listProcesses(function (error, processes) {
                    expect(error).to.not.exist
                    expect(processes.length).to.equal(1)

                    guvnor.kill(function () {
                      guvnor.disconnect(function () {
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
