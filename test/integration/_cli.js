'use strict'

const test = require('ava')
const cli = require('./fixtures/cli')

test.beforeEach(t => {
  return cli.then(cli => {
    t.context.cli = cli
  })
})

test.skip('CLI should show no processes', t => {
  return t.context.cli(['list'], 1)
  .then(stdout => {
    console.info('---> got output')
    t.is(stdout.trim(), '')
  })
})

test.skip('CLI should show empty list', t => {
  runCli(['list', '-d'], 1, done, function (stdout) {
    expect(stdout).to.contain('No running processes')
  })
})

test.skip('CLI should show empty json list', t => {
  runCli(['list', '--json'], 1, done, function (stdout) {
    expect(JSON.parse(stdout)).to.be.empty
  })
})

test.skip('CLI should start a process', t => {
  var script = path.resolve(path.join(__dirname, '..', 'fixtures', 'hello-world.js'))

  runCli(['start', script], 1, done, function (stdout) {
    expect(stdout).to.contain('Process hello-world.js started')

    runCli(['list', '--json'], 1, done, function (stdout) {
      var procs = JSON.parse(stdout)
      expect(procs.length).to.equal(1)
      expect(procs[0].name).to.equal('hello-world.js')
    })
  })
})

test.skip('CLI should stop a process', t => {
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
        })
      })
    })
  })
})

test.skip('CLI should remove a stopped process', t => {
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
            })
          })
        })
      })
    })
  })
})

test.skip('CLI should remove a running process', t => {
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
        })
      })
    })
  })
})

test.skip('CLI should start a process and override the name', t => {
  var script = path.resolve(path.join(__dirname, '..', 'fixtures', 'hello-world.js'))

  runCli(['start', script, '-n', 'foo'], 1, done, function (stdout) {
    expect(stdout).to.contain('Process foo started')

    runCli(['list', '--json'], 1, done, function (stdout) {
      var procs = JSON.parse(stdout)
      expect(procs.length).to.equal(1)
      expect(procs[0].name).to.equal('foo')
    })
  })
})

test.skip('CLI should start a process in debug mode', function () {

})

test.skip('CLI should restart a process', function () {

})

test.skip('CLI should start a process with arguments', function () {

})

test.skip('CLI should start a process with exec arguments', t => {

})

test.skip('CLI should start a process as a cluster', t => {

})

test.skip('CLI should increase number of cluster workers', t => {

})

test.skip('CLI should decrease number of cluster workers', t => {

})

test.skip('CLI should send an event to a process', t => {

})

test.skip('CLI should make a process dump heap', t => {

})

test.skip('CLI should make a process collect garbage', t => {

})

test.skip('CLI should send a signal to a process', t => {

})

test.skip('CLI should write to a processes stdin', t => {

})

test.skip('CLI should show logs', t => {

})

test.skip('CLI should only show logs for one process', t => {

})

test.skip('CLI should stop the daemon', t => {

})

test.skip('CLI should print config options', t => {

})

test.skip('CLI should report daemon status', t => {

})

test.skip('CLI should print config for the web monitor', t => {

})

test.skip('CLI should list users for the web monitor', t => {

})

test.skip('CLI should reset users password for the web monitor', t => {

})

test.skip('CLI should generate ssl certificates', t => {

})

test.skip('CLI should not show installed apps', t => {
  runCli(['lsapps'], 1, done, function (stdout) {
    expect(stdout.trim()).to.equal('')
  })
})

test.skip('CLI should deploy an application', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    expect(stdout.trim()).to.contain('Installed http-test from https://github.com/achingbrain/http-test.git')
  })
})

test.skip('CLI should deploy an application and override name', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git', '-n', 'foo'], 6, done, function (stdout) {
    expect(stdout.trim()).to.contain('Installed foo from https://github.com/achingbrain/http-test.git')
  })
})

test.skip('CLI should list deployed applications', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    runCli(['lsapps', '--json'], 1, done, function (stdout) {
      var apps = JSON.parse(stdout)
      expect(apps.length).to.equal(1)
      expect(apps[0].name).to.equal('http-test')
    })
  })
})

test.skip('CLI should remove deployed applications', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    runCli(['rmapp', 'http-test'], 1, done, function (stdout) {
      expect(stdout).to.contain('Removed app http-test')

      runCli(['lsapps', '--json'], 1, done, function (stdout) {
        var apps = JSON.parse(stdout)
        expect(apps.length).to.equal(0)
      })
    })
  })
})

test.skip('CLI should report the current application ref', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    runCli(['lsref', 'http-test', '--json'], 1, done, function (stdout) {
      var ref = JSON.parse(stdout)

      expect(ref.name).to.equal('master')
      expect(ref.type).to.equal('branch')
      expect(ref.commit).to.be.ok
    })
  })
})

test.skip('CLI should list available application refs', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    runCli(['lsrefs', 'http-test', '--json'], 1, done, function (stdout) {
      var refs = JSON.parse(stdout)

      expect(refs.length).to.equal(5)
      expect(refs[0].type).to.equal('branch')
      expect(refs[0].name).to.equal('a-branch')
      expect(refs[0].commit).to.be.ok
    })
  })
})

test.skip('CLI should update application refs', t => {

})

test.skip('CLI should switch an application ref', t => {

})

test.skip('CLI should start an app', t => {

})
