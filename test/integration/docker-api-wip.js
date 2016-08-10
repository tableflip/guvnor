/*return

var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var it = require('mocha').it
var expect = require('chai').expect
var runCli = require('../../platform/run-cli')
var path = require('path')
var async = require('async')
var child_process = require('child_process')
var OutputBuffer = require('output-buffer')
var loadApi = require('../../../lib/local/api')
var setup = require('./setup')

describe.skip('docker/api', function () {
  this.timeout(600000)
  var stopProcesses
  var stopDaemon
  var rootApi
  var userApi
  var startDocker
  var stopDocker

  before(function (done) {
    this.timeout(600000)

    setup(function (error, result) {
      startDocker = result.beforeEach

      after(result.after)

      done(error)
    })
  })

  beforeEach(function (done) {
    startDocker(function (error, results) {
      rootApi = results.rootApi
      userApi = results.userApi
      stopDocker = results.afterEach

      done(error)
    })
  })

  afterEach(function (done) {
    stopDocker(done)
  })

  it('should show no processes', function (done) {
    userApi.process.list(function (error, processes) {
      expect(error).to.not.exist
      expect(processes).to.be.empty
      done()
    })
  })

  it('should show no processes', function (done) {
    runCli(['list'], 1, done, function (stdout) {
      expect(stdout.trim()).to.equal('')
      done()
    })
  })

  it('should show empty list', function (done) {
    runCli(['list', '-d'], 1, done, function (stdout) {
      expect(stdout).to.contain('No running processes')
      done()
    })
  })

  it('should show empty json list', function (done) {
    runCli(['list', '--json'], 1, done, function (stdout) {
      expect(JSON.parse(stdout)).to.be.empty
      done()
    })
  })

  it('should start a process', function (done) {
    var script = path.resolve(path.join(__dirname, '..', 'fixtures', 'hello-world.js'))

    runCli(['start', script], 1, done, function (stdout) {
      expect(stdout).to.contain('Process hello-world.js started')

      runCli(['list', '--json'], 1, done, function (stdout) {
        var procs = JSON.parse(stdout)
        expect(procs.length).to.equal(1)
        expect(procs[0].name).to.equal('hello-world.js')

        done()
      })
    })
  })

  it('should stop a process', function (done) {
    var script = path.resolve(path.join(__dirname, '..', 'fixtures', 'hello-world.js'))

    runCli(['start', script], 1, done, function (stdout) {
      expect(stdout).to.contain('Process hello-world.js started')

      runCli(['list', '--json'], 1, done, function (stdout) {
        var procs = JSON.parse(stdout)
        expect(procs.length).to.equal(1)
        expect(procs[0].name).to.equal('hello-world.js')
//        expect(procs[0].status).to.equal('running')

        runCli(['stop', 'hello-world.js'], 1, done, function (stdout) {
          expect(stdout).to.contain('Process hello-world.js stopped')

          runCli(['list', '--json'], 1, done, function (stdout) {
            var procs = JSON.parse(stdout)
            expect(procs.length).to.equal(1)
            expect(procs[0].name).to.equal('hello-world.js')
            expect(procs[0].status).to.equal('stopped')

            done()
          })
        })
      })
    })
  })

  it('should remove a stopped process', function (done) {
    var script = path.resolve(path.join(__dirname, '..', 'fixtures', 'hello-world.js'))

    runCli(['start', script], 1, done, function (stdout) {
      expect(stdout).to.contain('Process hello-world.js started')

      runCli(['list', '--json'], 1, done, function (stdout) {
        var procs = JSON.parse(stdout)
        expect(procs.length).to.equal(1)
        expect(procs[0].name).to.equal('hello-world.js')

        runCli(['stop', 'hello-world.js'], 1, done, function (stdout) {
          expect(stdout).to.contain('Process hello-world.js stopped')

          runCli(['list', '--json'], 1, done, function (stdout) {
            var procs = JSON.parse(stdout)
            expect(procs.length).to.equal(1)
            expect(procs[0].name).to.equal('hello-world.js')
            expect(procs[0].status).to.equal('stopped')

            runCli(['remove', 'hello-world.js'], 1, done, function (stdout) {
              expect(stdout).to.contain('Process hello-world.js removed')

              runCli(['list', '--json'], 1, done, function (stdout) {
                var procs = JSON.parse(stdout)
                expect(procs).to.be.empty

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should remove a running process', function (done) {
    var script = path.resolve(path.join(__dirname, '..', 'fixtures', 'hello-world.js'))

    runCli(['start', script], 1, done, function (stdout) {
      expect(stdout).to.contain('Process hello-world.js started')

      runCli(['list', '--json'], 1, done, function (stdout) {
        var procs = JSON.parse(stdout)
        expect(procs.length).to.equal(1)
        expect(procs[0].name).to.equal('hello-world.js')

        runCli(['remove', 'hello-world.js'], 1, done, function (stdout) {
          expect(stdout).to.contain('Process hello-world.js removed')

          runCli(['list', '--json'], 1, done, function (stdout) {
            var procs = JSON.parse(stdout)
            expect(procs).to.be.empty

            done()
          })
        })
      })
    })
  })

  it('should start a process and override the name', function (done) {
    var script = path.resolve(path.join(__dirname, '..', 'fixtures', 'hello-world.js'))

    runCli(['start', script, '-n', 'foo'], 1, done, function (stdout) {
      expect(stdout).to.contain('Process foo started')

      runCli(['list', '--json'], 1, done, function (stdout) {
        var procs = JSON.parse(stdout)
        expect(procs.length).to.equal(1)
        expect(procs[0].name).to.equal('foo')

        done()
      })
    })
  })

  it('should start a process in debug mode', function () {

  })

  it('should restart a process', function () {

  })

  it('should start a process with arguments', function () {

  })

  it('should start a process with exec arguments', function (done) {
    done()
  })

  it('should start a process as a cluster', function (done) {
    done()
  })

  it('should increase number of cluster workers', function (done) {
    done()
  })

  it('should decrease number of cluster workers', function (done) {
    done()
  })

  it('should send an event to a process', function (done) {
    done()
  })

  it('should make a process dump heap', function (done) {
    done()
  })

  it('should make a process collect garbage', function (done) {
    done()
  })

  it('should send a signal to a process', function (done) {
    done()
  })

  it('should write to a processes stdin', function (done) {
    done()
  })

  it('should show logs', function (done) {
    done()
  })

  it('should only show logs for one process', function (done) {
    done()
  })

  it('should stop the daemon', function (done) {
    done()
  })

  it('should print config options', function (done) {
    done()
  })

  it('should report daemon status', function (done) {
    done()
  })

  it('should print config for the web monitor', function (done) {
    done()
  })

  it('should list users for the web monitor', function (done) {
    done()
  })

  it('should reset users password for the web monitor', function (done) {
    done()
  })

  it('should generate ssl certificates', function (done) {
    done()
  })

  it('should not show installed apps', function (done) {
    runCli(['lsapps'], 1, done, function (stdout) {
      expect(stdout.trim()).to.equal('')
      done()
    })
  })

  it('should deploy an application', function (done) {
    runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
      expect(stdout.trim()).to.contain('Installed http-test from https://github.com/achingbrain/http-test.git')
      done()
    })
  })

  it('should deploy an application and override name', function (done) {
    runCli(['install', 'https://github.com/achingbrain/http-test.git', '-n', 'foo'], 6, done, function (stdout) {
      expect(stdout.trim()).to.contain('Installed foo from https://github.com/achingbrain/http-test.git')
      done()
    })
  })

  it('should list deployed applications', function (done) {
    runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
      runCli(['lsapps', '--json'], 1, done, function (stdout) {
        var apps = JSON.parse(stdout)
        expect(apps.length).to.equal(1)
        expect(apps[0].name).to.equal('http-test')

        done()
      })
    })
  })

  it('should remove deployed applications', function (done) {
    runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
      runCli(['rmapp', 'http-test'], 1, done, function (stdout) {
        expect(stdout).to.contain('Removed app http-test')

        runCli(['lsapps', '--json'], 1, done, function (stdout) {
          var apps = JSON.parse(stdout)
          expect(apps.length).to.equal(0)

          done()
        })
      })
    })
  })

  it('should report the current application ref', function (done) {
    runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
      runCli(['lsref', 'http-test', '--json'], 1, done, function (stdout) {
        var ref = JSON.parse(stdout)

        expect(ref.name).to.equal('master')
        expect(ref.type).to.equal('branch')
        expect(ref.commit).to.be.ok
        done()
      })
    })
  })

  it('should list available application refs', function (done) {
    runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
      runCli(['lsrefs', 'http-test', '--json'], 1, done, function (stdout) {
        var refs = JSON.parse(stdout)

        expect(refs.length).to.equal(5)
        expect(refs[0].type).to.equal('branch')
        expect(refs[0].name).to.equal('a-branch')
        expect(refs[0].commit).to.be.ok
        done()
      })
    })
  })

  it('should update application refs', function (done) {
    done()
  })

  it('should switch an application ref', function (done) {
    done()
  })

  it('should start an app', function (done) {
    done()
  })
})
  */
