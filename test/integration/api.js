'use strict'

const test = require('ava')
const api = require('./fixtures/api')
const daemon = require('./fixtures/daemon')
const faker = require('faker')
const loadApi = require('../../lib/local')
const utils = require('./fixtures/utils')
const winston = require('winston')
winston.level = 'debug'
winston.cli()

const DEFAULT_TIMEOUT = 30000

test.beforeEach(t => {
  return api.then(api => {
    t.context.api = api
  })
})

test('API should return a process list', t => {
  return t.context.api.process.list()
  .then(processes => {
    t.truthy(Array.isArray(processes))
  })
})

test('API should return an app list', t => {
  return t.context.api.app.list()
  .then(apps => {
    t.truthy(Array.isArray(apps))
  })
})

test('API should return a 404 for a non-existant process', t => {
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.get(name)
  .catch(error => {
    t.is(error.statusCode, 404)
  })
})

test('API should start a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.start(script, {
    name: name
  })
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('API should refuse to start a process twice', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.start(script, {
    name: name
  })
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(() => t.context.api.process.start(script, {
    name: name
  }))
  .catch(error => t.is(error.statusCode, 409))
})

test('API should use the file name to name a process if no name was specified', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = 'hello-world.js'

  return t.context.api.process.start(script)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('API should stop a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
  // it should be reported as stopped
  .then(proc => utils.isProc(t, name, 'stopped', proc))
  // ensure we are reporting it as stopped
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => utils.isProc(t, name, 'stopped', proc))
})

test.cb('Should emit a process:stopping event when stopping a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  utils.onProcessEvent('process:stopping', name, t.context.api)()
  .then(event => utils.isProc(t, name, 'stopping', event.proc))
  .then(t.end)
  .catch(t.end)


  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
})

test.cb('Should emit a process:stopped event when a process stops', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  utils.onProcessEvent('process:stopped', name, t.context.api)()
  .then(event => utils.isProc(t, name, 'stopped', event.proc))
  .then(t.end)
  .catch(t.end)


  // start the process
  t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
})

test.cb('Should emit a process:started event when starting a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  utils.onProcessEvent('process:started', name, t.context.api)()
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(t.end)
  .catch(t.end)


  // start the process
  t.context.api.process.start(script, {
    name: name
  })
})

test('API should remove a stopped process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // stop the process
  .then(() => t.context.api.process.stop(name))
  // remove the process
  .then(() => t.context.api.process.remove(name))
  // ensure it has been removed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => t.is(proc, undefined))
})

test('API should remove a running process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.api.process.remove(name))
  // ensure it has been removed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => t.is(proc, undefined))
})

test('API should start a process with arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  const argv = ['foo', 'bar', 'baz']

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    argv: argv
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    // first two args are /path/to/node and /path/to/process-wrapper
    t.deepEqual(proc.master.argv.slice(2), argv)
  })
})

test('API should start a process with exec arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  const execArgv = ['--log_gc', '--trace_code_flushing', '--trace_stub_failures']

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    execArgv: execArgv
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    t.deepEqual(proc.master.execArgv, execArgv)
  })
})

test('API should strip invalid exec arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  const execArgv = ['--log_gc', '--trace_code_flushing', '--trace_stub_failures']

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    execArgv: execArgv.concat(['not', 'valid', 'arguments'])
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    t.deepEqual(proc.master.execArgv, execArgv)
  })
})

test('API should report daemon status', t => {
  return t.context.api.status()
  .then(status => {
    t.truthy(status)
    t.truthy(status.hostname)
    t.truthy(status.type)
    t.truthy(status.platform)
    t.truthy(status.arch)
    t.truthy(status.release)
    t.truthy(status.daemon)
    t.truthy(status.time)
    t.truthy(status.uptime)
    t.truthy(status.freeMemory)
    t.truthy(status.totalMemory)
    t.truthy(status.cpus)
    t.truthy(status.versions)
  })
})

test('API should increase number of cluster workers', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // check that we can actually run this test..
  return t.context.api.status()
  .then(status => {
    if (status.cpus.length < 2) {
      console.warn('!!!!!! There are not enough CPUs available to run process worker tests')
      return t.pass()
    }

    // start the process
    return t.context.api.process.start(script, {
      name: name,
      workers: 1
    })
    // when it's started
    .then(utils.onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 1))
    .then(() => {
      t.context.api.process.workers(name, 2)

      // when the new worker starts
      return utils.onProcessEvent('process:worker:started', name, t.context.api)()
    })
    // make sure the right args were passed
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => {
      t.is(proc.workers.length, 2)
    })
  })
})

test('API should decrease number of cluster workers', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // check that we can actually run this test..
  return t.context.api.status()
  .then(status => {
    if (status.cpus.length < 2) {
      console.warn('!!!!!! There are not enough CPUs available to run process worker tests')
      return t.pass()
    }

    // start the process
    return t.context.api.process.start(script, {
      name: name,
      workers: 2
    })
    // when it's started
    .then(utils.onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 2))
    .then(() => {
      t.context.api.process.workers(name, 1)

      // when the new worker stops
      return utils.onProcessEvent('process:worker:exit', name, t.context.api)()
    })
    // make sure the right args were passed
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => {
      t.is(proc.workers.length, 1)
    })
  })

})

test('API should send an event to a process', t => {
  const script = '/opt/guvnor/test/fixtures/receive-event.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  const args = ['arg1', 'arg2', 'arg3']

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.api.process.sendEvent(name, 'custom:event:sent', args))
  .then(utils.onProcessEvent('custom:event:received', name, t.context.api))
  // should have echoed our args back to us
  .then(event => t.deepEqual(event.args, args))
})

test('API should make a process dump heap', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))
  .then(snapshots => {
    t.is(snapshots.length, 2)
    t.truthy(snapshots[0].id)
    t.truthy(snapshots[1].id)
  })
  // we should emit an event when snapshots are taken
  .then(utils.onProcessEvent('process:snapshot:complete', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
})

test('API should list heap dumps for a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // make sure there are no snapshots
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 0)
  })
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))
  // when snapshot has been taken ensure we list it correctly
  .then(utils.onProcessEvent('process:snapshot:complete', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 2)
  })

})

test('API should download a heap dump', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // make sure there are no snapshots
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 0)
  })
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))
  .then(utils.onProcessEvent('process:snapshot:complete', name, t.context.api))
  .then(event => {
    const snapshots = event.args[0]
    const snapshot = snapshots[0]

    const buffer = new Buffer(snapshot.size)
    let offset = 0

    t.truthy(Array.isArray(snapshots))
    t.is(snapshots.length, 2)
    return t.context.api.process.getHeapSnapshot(name, snapshots[0].id, (chunk, enc, next) => {
      chunk.copy(buffer, offset)

      offset += chunk.length

      next()
    })
    .then(() => {
      // should have copied all of the bytes
      t.is(offset, snapshot.size)

      const file = buffer.toString('utf8')

      // should parse as JSON
      t.truthy(JSON.parse(file))
    })
  })

})

test('API should remove a heap dump', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // make sure there are no snapshots
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 0)
  })
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))
  // when snapshots have been taken, remove one of them
  .then(utils.onProcessEvent('process:snapshot:complete', name, t.context.api))
  .then(event => {
    const snapshots = event.args[0]

    t.truthy(Array.isArray(snapshots))
    t.is(snapshots.length, 2)
    t.context.api.process.removeHeapSnapshot(name, snapshots[0].id)
  })
  // when the snapshot has been removed, make sure we report it as removed
  .then(utils.onProcessEvent('process:snapshot:removed', name, t.context.api))
  .then((event) => {
    const id = event.args[0]

    t.truthy(id) // snapshot id

    return t.context.api.process.listHeapSnapshots(name)
    .then(result => {
      t.truthy(Array.isArray(result))
      t.falsy(result.find(snapshot => snapshot.id === id))
    })
  })
})

test('API should make a process collect garbage', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // take a heap snapshot
  .then(() => t.context.api.process.gc(name))
  .then(utils.onProcessEvent('process:gc:complete', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
})

test('API should send a signal to a process', t => {
  const script = '/opt/guvnor/test/fixtures/receive-signal.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // send some signals
  .then(() => t.context.api.process.sendSignal(name, 'SIGUSR1'))
  .then(utils.onProcessEvent('signal:received', name, t.context.api))
  .then(event => t.deepEqual(event.args, ['SIGUSR1']))
})

test('API should send a signal to a process and kill it', t => {
  const script = '/opt/guvnor/test/fixtures/receive-signal.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  let workerPid = 0

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // store the original worker pid
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    workerPid = proc.workers[0].pid
  })
  // send SIGTERM
  .then(() => {
    t.context.api.process.sendSignal(name, 'SIGTERM', true)

    // wait for a new worker to be spawned
    return utils.onProcessEvent('process:worker:started', name, t.context.api)()
  })
  // then list the processes again
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    // worker's pid should have changed
    t.not(workerPid, proc.workers[0].pid)
  })
})

test('API should show logs', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  let logs = ''

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.api.logs(line => {
    logs += line + '\n'
  }))
  .then(() => {
    t.truthy(logs.trim())
  })
})

test('API should only show logs for one process', t => {
  const scriptOne = '/opt/guvnor/test/fixtures/ones.js'
  const scriptTwo = '/opt/guvnor/test/fixtures/twos.js'
  const nameOne = `${faker.lorem.word()}_${faker.lorem.word()}`
  const nameTwo = `${faker.lorem.word()}_${faker.lorem.word()}`
  let logs = ''

  return Promise.all([
    t.context.api.process.start(scriptOne, {
      name: nameOne,
      workers: 1
    })
    // when it's started
    .then(utils.onProcessEvent('process:started', nameOne, t.context.api)),
    t.context.api.process.start(scriptTwo, {
      name: nameTwo,
      workers: 1
    })
    // when it's started
    .then(utils.onProcessEvent('process:started', nameTwo, t.context.api))
  ])
  .then(() => t.context.api.process.logs(nameOne, false, line => {
    logs += line + '\n'
  }))
  .then(() => {
    t.truthy(logs.trim())
    t.is(logs.trim().indexOf('two'), -1)
  })
})

test('API should deploy an application', t => {
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.api.app.install(url)
  .then(() => t.context.api.app.get('http-test'))
  .then(app => {
    t.is(app.url, url)
    t.is(app.name, 'http-test')
  })
})

test('API should deploy an application and override name', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.get(name))
  .then(app => {
    t.is(app.url, url)
    t.is(app.name, name)
  })
})

test('API should not deploy an application with the same name twice', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.install(url, name, () => {}))
  .catch(error => t.is(error.statusCode, 409))
})

test('API should list deployed applications', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.list())
  .then(apps => t.truthy(apps.find(app => app.name === name)))
})

test('API should remove deployed applications', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.list())
  .then(apps => t.truthy(apps.find(app => app.name === name)))
  .then(() => t.context.api.app.remove(name))
  .then(() => t.context.api.app.list())
  .then(apps => t.falsy(apps.find(app => app.name === name)))
})

test('API should return a 404 for a non-existant app', t => {
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.get(name)
  .catch(error => {
    t.is(error.statusCode, 404)
  })
})

test('API should report the current application ref', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.ref(name))
  .then(ref => {
    t.is(ref.name, 'master')
    t.is(ref.type, 'branch')
    t.truthy(ref.commit)
  })
})

test('API should list available application refs', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.refs(name))
  .then(refs => {
    t.is(refs.length, 5)
    t.is(refs[0].name, 'a-branch')
    t.is(refs[0].type, 'branch')
    t.truthy(refs[0].commit)
  })
})

test('API should update application refs', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.update(name, () => {}))
  .then(app => t.is(app.name, name))
})

test('API should switch an application ref', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.ref(name))
  .then(ref => {
    t.is(ref.name, 'master')
    t.is(ref.type, 'branch')
    t.truthy(ref.commit)
  })
  .then(() => t.context.api.app.setRef(name, 'a-branch'))
  .then(() => t.context.api.app.ref(name))
  .then(ref => {
    t.is(ref.name, 'a-branch')
    t.is(ref.type, 'branch')
    t.truthy(ref.commit)
  })
})

test('API should refuse to switch to an invalid ref', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.app.setRef(name, 'i do not exist'))
  .catch(error => t.is(error.statusCode, 400))
})

test('API should start an app', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.process.start(name))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('API should refuse to update a running app', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.process.start(name))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(() => t.context.api.app.update(name, () => {}))
  .catch(error => t.is(error.statusCode, 409))
})

test('API should refuse to switch refs for a running app', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, () => {})
  .then(() => t.context.api.process.start(name))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(event => utils.isProc(t, name, 'running', event.proc))
  .then(() => t.context.api.app.setRef(name, 'a-branch'))
  .catch(error => t.is(error.statusCode, 409))
})

test('API should add a user', t => {
  return t.context.api.user.add('guvnor-user-1')
  .then(certs => loadApi(certs))
  .then(api => api.process.list())
  .then(processes => t.truthy(Array.isArray(processes)))
})

test('API should not add a user twice', t => {
  return t.context.api.user.add('guvnor-user-2')
  .then(() => t.context.api.user.add('guvnor-user-2'))
  .catch(error => t.is(error.statusCode, 409))
})

test('API should list users', t => {
  return t.context.api.user.list()
  .then(users => {
    t.truthy(users.length > 0)
    t.truthy(users.find(user => user.name === 'root'))
  })
})

test('API should fail to add a non-existant user', t => {
  return t.context.api.user.add('dave')
  .catch(error => t.is(error.statusCode, 404))
})

test('API should remove a user', t => {
  let api = null

  return t.context.api.user.add('guvnor-user-3')
  .then(certs => loadApi(certs))
  .then(result => {
    api = result

    return api.process.list()
  })
  .then(processes => t.truthy(Array.isArray(processes)))
  .then(() => t.context.api.user.remove('guvnor-user-3'))
  .then(() => api.process.list())
  .catch(error => t.is(error.statusCode, 401))
  .then(() => t.context.api.user.add('guvnor-user-3'))
  .then(certs => loadApi(certs))
  .then(api => api.process.list())
  .then(processes => t.truthy(Array.isArray(processes)))
})

test.todo('API should start a process in debug mode')

test.todo('API should stop the daemon')
