'use strict'

const winston = require('winston')
winston.level = 'debug'
winston.cli()

const test = require('ava')
const api = require('./fixtures/api')
const faker = require('faker')

const onProcessEvent = (event, name, api) => {
  return new Promise((resolve, reject) => {
    const listener = (host, proc) => {
      if (proc.name !== name) {
        return
      }

      api.removeListener(event, listener)

      resolve(proc)
    }

    api.on(event, listener)
  })
}

const isProc = (t, name, script, status, proc) => {
  if (!proc) {
    throw new Error('proc expected')
  }

  t.is(proc.name, name)
  t.is(proc.status, status)
  t.is(proc.script, script)
}

const wait = (ms) => new Promise((resolve, reject) => {
  console.info('-----> Using a wait. How do you sleep at night?')
  setTimeout(() => resolve(), ms)
})

test.after.always('Print daemon logs', (t) => {
  if (api.printLogs) {
    console.info('')
    console.info('---- Start test logs -----')
    console.info('')
    return api.printLogs()
    .then(() => {
      console.info('')
      console.info('---- End test logs -----')
      console.info('')
    })
  }
})

test.serial('Should return an empty process list', (t) => {
  return api.then((api) => {
    return api.process.list()
    .then((processes) => {
      t.is(processes.length, 0)
    })
  })
})

test('Should start a process', (t) => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return api.then((api) => {
    return api.process.start(script, {
      name: name
    })
    .then(onProcessEvent('process:started', name, api))
    .then((proc) => isProc(t, name, script, 'running', proc))
    .then(() => wait(1000))
    .then(() => api.process.list())
    .then((procs) => procs.find((proc) => proc.name === name))
    .then((proc) => isProc(t, name, script, 'running', proc))
  })
})

test('Should use the file name to name a process if no name was specified', (t) => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = 'hello-world.js'

  return api.then((api) => {
    return api.process.start(script)
    .then(onProcessEvent('process:started', name, api))
    .then((proc) => isProc(t, name, script, 'running', proc))
    .then(() => wait(1000))
    .then(() => api.process.list())
    .then((procs) => procs.find((proc) => proc.name === name))
    .then((proc) => isProc(t, name, script, 'running', proc))
  })
})

test('Should stop a process', (t) => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return api.then((api) => {
    // start the process
    return api.process.start(script, {
      name: name
    })
    // when it's started
    .then(onProcessEvent('process:started', name, api))
    // stop the process
    .then(() => api.process.stop(name))
    // when it's stopped
    .then(onProcessEvent('process:stopped', name, api))
    // ensure we are reporting it as stopped
    .then(() => api.process.list())
    .then((procs) => procs.find((proc) => proc.name === name))
    .then((proc) => isProc(t, name, script, 'stopped', proc))
  })
})

test('Should remove a stopped process', (t) => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return api.then((api) => {
    // start the process
    api.process.start(script, {
      name: name
    })
    // when it's started
    .then(onProcessEvent('process:started', name, api))
    // stop the process
    .then(() => api.process.stop(name))
    // when it's stopped
    .then(onProcessEvent('process:stopped', name, api))
    // remove the process
    .then(() => api.process.remove(name))
    // ensure it has been removed
    .then(() => api.process.list())
    .then((procs) => procs.find((proc) => proc.name === name))
    .then((proc) => t.is(proc, undefined))
  })
})

test('Should remove a running process', (t) => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return api.then((api) => {
    // start the process
    api.process.start(script, {
      name: name
    })
    // when it's started
    .then(onProcessEvent('process:started', name, api))
    .then(() => api.process.remove(name))
    // ensure it has been removed
    .then(() => api.process.list())
    .then((procs) => procs.find((proc) => proc.name === name))
    .then((proc) => t.is(proc, undefined))
  })
})


/*

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

  it('should add a user', function (done) {
    done()
  })

  it('should fail to add a non-existant user', function (done) {
    done()
  })

})
  */
