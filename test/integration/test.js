'use strict'

const winston = require('winston')
winston.level = 'debug'
winston.cli()

const test = require('ava')
const api = require('./fixtures/api')
const faker = require('faker')

const DEFAULT_TIMEOUT = 30000

const onProcessEvent = (event, name, api) => {
  const promise = new Promise((resolve, reject) => {
    const listener = function (host, proc, arg0, arg1, arg2, etc) {
      if (proc.name !== name) {
        return
      }

      api.removeListener(event, listener)

      resolve({
        host: host,
        proc: proc,
        event: event,
        args: Array.prototype.slice.call(arguments, 2)
      })
    }

    api.on(event, listener)
  })

  return () => promise
}

const isProc = (t, name, script, status, proc) => {
  if (!proc) {
    throw new Error('proc expected, got', proc)
  }

  t.is(proc.name, name)
  t.is(proc.status, status)
  t.is(proc.script, script)
}

const startTimer = (t, timeout) => {
  timeout = timeout || DEFAULT_TIMEOUT

  return setTimeout(() => {
    console.error(`Test "${t._test.title.replace('beforeEach for', '').trim()}" has timed out!`)
    t.fail()
    throw new Error('Timed out!')
  }, timeout)
}

const stopTimer = (ref) => {
  clearTimeout(ref)
}

test.beforeEach(t => {
  return api.then((api) => {
    t.context.api = api
    //t.context.startTimer = startTimer(t)
  })
})

test.afterEach.always(t => {
  //stopTimer(t.context.timer)
})

test.after.always('Print daemon logs', t => {
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

test.serial('Should return an empty process list', t => {
  return t.context.api.process.list()
  .then(processes => {
    t.truthy(Array.isArray(processes))
    t.is(processes.length, 0)
  })
})

test.serial('Should return an empty app list', t => {
  return t.context.api.app.list()
  .then(apps => {
    t.truthy(Array.isArray(apps))
    t.is(apps.length, 0)
  })
})

test('Should start a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.start(script, {
    name: name
  })
  .then(onProcessEvent('process:started', name, t.context.api))
  .then(event => isProc(t, name, script, 'running', event.proc))
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => isProc(t, name, script, 'running', proc))
})

test('Should use the file name to name a process if no name was specified', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = 'hello-world.js'

  return t.context.api.process.start(script)
  .then(onProcessEvent('process:started', name, t.context.api))
  .then(event => isProc(t, name, script, 'running', event.proc))
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => isProc(t, name, script, 'running', proc))
})

test('Should stop a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
  // it should be reported as stopped
  .then(proc => isProc(t, name, script, 'stopped', proc))
  // ensure we are reporting it as stopped
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => isProc(t, name, script, 'stopped', proc))
})

test.cb('Should emit a process:stopping event when stopping a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  onProcessEvent('process:stopping', name, t.context.api)()
  .then(event => isProc(t, name, script, 'stopping', event.proc))
  .then(t.end)
  .catch(t.end)

  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
})

test.cb('Should emit a process:stopped event when a process stops', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  onProcessEvent('process:stopped', name, t.context.api)()
  .then(event => isProc(t, name, script, 'stopped', event.proc))
  .then(t.end)
  .catch(t.end)

  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
})

test.cb('Should emit a process:started event when starting a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  onProcessEvent('process:started', name, t.context.api)()
  .then(event => isProc(t, name, script, 'running', event.proc))
  .then(t.end)
  .catch(t.end)

  // start the process
  t.context.api.process.start(script, {
    name: name
  })
})

test('Should remove a stopped process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
  // remove the process
  .then(() => t.context.api.process.remove(name))
  // ensure it has been removed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => t.is(proc, undefined))
})

test('Should remove a running process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.api.process.remove(name))
  // ensure it has been removed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => t.is(proc, undefined))
})

test.todo('should start a process in debug mode')

test('should start a process with arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  t.context.api.process.start(script, {
    name: name,
    argv: ['foo', 'bar', 'baz']
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    t.is(proc.argv, ['foo', 'bar', 'baz'])
  })
})

test('should start a process with exec arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  t.context.api.process.start(script, {
    name: name,
    execArgv: ['foo', 'bar', 'baz']
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    t.is(proc.execArgv, ['foo', 'bar', 'baz'])
  })
})

test('should report daemon status', t => {
  return t.context.api.status()
  .then(status => {
    t.truthy(status)
  })
})

test('should increase number of cluster workers', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // check that we can actually run this test..
  t.context.api.status()
  .then(status => {
    if (status.cpus.length < 2) {
      console.info('!!!!!! There are not enough CPUs available to run process worker tests')
      return t.pass()
    }

    // start the process
    return t.context.api.process.start(script, {
      name: name,
      workers: 1
    })
    // when it's started
    .then(onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 1))
    .then(() => t.context.api.process.workers(name, 2))
    // make sure the right args were passed
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => {
      t.is(proc.workers.length, 2)
    })
  })
})

test('should decrease number of cluster workers', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // check that we can actually run this test..
  t.context.api.status()
  .then(status => {
    if (status.cpus.length < 2) {
      console.info('!!!!!! There are not enough CPUs available to run process worker tests')
      return t.pass()
    }

    // start the process
    return t.context.api.process.start(script, {
      name: name,
      workers: 2
    })
    // when it's started
    .then(onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 2))
    .then(() => t.context.api.process.workers(name, 1))
    // make sure the right args were passed
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => {
      t.is(proc.workers.length, 1)
    })
  })
})

test('should send an event to a process', t => {
  const script = '/opt/guvnor/test/fixtures/receive-event.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.api.process.sendEvent(name, 'custom:event:sent', 'arg1', 'arg2', 'arg3'))
  .then(onProcessEvent('custom:event:received', name, t.context.api))
  .then(event => t.deepEqual(event.args, ['arg1', 'arg2', 'arg3']))
})

test.cb('should make a process dump heap', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))

  // we should emit an event when snapshots are taken
  onProcessEvent('process:snapshot:complete', name, t.context.api)()
  .then(event => isProc(t, name, script, 'running', event.proc))
  .then(t.end)
  .catch(t.end)
})

test.cb('should list heap dumps for a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // make sure there are no snapshots
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 0)
  })
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))

  // when snapshot has been taken ensure we list it correctly
  onProcessEvent('process:snapshot:complete', name, t.context.api)()
  .then(event => isProc(t, name, script, 'running', event.proc))
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 2)
  })
  .then(t.end)
  .catch(t.end)
})

test.todo('should download a heap dump')

test.cb('should remove a heap dump', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // make sure there are no snapshots
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 0)
  })
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))

  // when snapshots have been taken, remove one of them
  onProcessEvent('process:snapshot:complete', name, t.context.api)()
  .then(event => {
    const snapshots = event.args[0]

    t.truthy(Array.isArray(snapshots))
    t.is(snapshots.length, 2)
    t.context.api.process.removeHeapSnapshot(name, snapshots[0].id)
  })

  // when the snapshot has been removed, make sure we report it as removed
  onProcessEvent('process:snapshot:removed', name, t.context.api)()
  .then((event) => {
    const id = event.args[0]

    t.truthy(id) // snapshot id

    return t.context.api.process.listHeapSnapshots(name)
    .then(result => {
      t.truthy(Array.isArray(result))
      t.falsy(result.find(snapshot => snapshot.id === id))
    })
  })
  .then(t.end)
  .catch(t.end)
})

test.cb('should make a process collect garbage', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  onProcessEvent('process:gc:complete', name, t.context.api)()
  .then(event => isProc(t, name, script, 'running', event.proc))
  .then(t.end)

  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // take a heap snapshot
  .then(() => t.context.api.process.gc(name))
})

test.todo('should send a signal to a process')

test.todo('should write to a processes stdin')

test.todo('should show logs')

test.todo('should only show logs for one process')

test.todo('should stop the daemon')

test.todo('should print config options')

test.todo('should print config for the web monitor')

test.todo('should list users for the web monitor')

test.todo('should reset users password for the web monitor')

test.todo('should generate ssl certificates')

test.skip('should deploy an application', function (done) {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    expect(stdout.trim()).to.contain('Installed http-test from https://github.com/achingbrain/http-test.git')
    done()
  })
})

test.skip('should deploy an application and override name', function (done) {
  runCli(['install', 'https://github.com/achingbrain/http-test.git', '-n', 'foo'], 6, done, function (stdout) {
    expect(stdout.trim()).to.contain('Installed foo from https://github.com/achingbrain/http-test.git')
    done()
  })
})

test.skip('should list deployed applications', function (done) {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    runCli(['lsapps', '--json'], 1, done, function (stdout) {
      var apps = JSON.parse(stdout)
      expect(apps.length).to.equal(1)
      expect(apps[0].name).to.equal('http-test')

      done()
    })
  })
})

test.skip('should remove deployed applications', function (done) {
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

test.skip('should report the current application ref', function (done) {
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

test.skip('should list available application refs', function (done) {
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

test.todo('should update application refs')

test.todo('should switch an application ref')

test.todo('should start an app')

test.todo('should add a user')

test.todo('should fail to add a non-existant user')
