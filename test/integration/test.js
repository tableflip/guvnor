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
//    t.context.startTimer = startTimer(t)
  })
})

test.afterEach.always(t => {
//  stopTimer(t.context.timer)
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

test('should return a 404 for a non-existant process', t => {
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.get(name)
  .catch(error => {
    t.is(error.statusCode, 404)
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
  return t.context.api.process.start(script, {
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
  return t.context.api.process.start(script, {
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
  const argv = ['foo', 'bar', 'baz']

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    argv: argv
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    // first two args are /path/to/node and /path/to/process-wrapper
    t.deepEqual(proc.master.argv.slice(2), argv)
  })
})

test('should start a process with exec arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  const execArgv = ['--log_gc', '--trace_code_flushing', '--trace_stub_failures']

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    execArgv: execArgv
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    t.deepEqual(proc.master.execArgv, execArgv)
  })
})

test('should strip invalid exec arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  const execArgv = ['--log_gc', '--trace_code_flushing', '--trace_stub_failures']

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    execArgv: execArgv.concat(['not', 'valid', 'arguments'])
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // make sure the right args were passed
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    t.deepEqual(proc.master.execArgv, execArgv)
  })
})

test('should report daemon status', t => {
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

test('should increase number of cluster workers', t => {
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
    .then(onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 1))
    .then(() => {
      t.context.api.process.workers(name, 2)

      // when the new worker starts
      return onProcessEvent('process:worker:started', name, t.context.api)()
    })
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
    .then(onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 2))
    .then(() => {
      t.context.api.process.workers(name, 1)

      // when the new worker stops
      return onProcessEvent('process:worker:exit', name, t.context.api)()
    })
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
  const args = ['arg1', 'arg2', 'arg3']

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.api.process.sendEvent(name, 'custom:event:sent', args))
  .then(onProcessEvent('custom:event:received', name, t.context.api))
  // should have echoed our args back to us
  .then(event => t.deepEqual(event.args, args))
})

test('should make a process dump heap', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // take a heap snapshot
  .then(() => t.context.api.process.takeHeapSnapshot(name))
  .then(snapshots => {
    t.is(snapshots.length, 2)
    t.truthy(snapshots[0].id)
    t.truthy(snapshots[1].id)
  })
  // we should emit an event when snapshots are taken
  .then(onProcessEvent('process:snapshot:complete', name, t.context.api))
  .then(event => isProc(t, name, script, 'running', event.proc))
})

test('should list heap dumps for a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
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
  .then(onProcessEvent('process:snapshot:complete', name, t.context.api))
  .then(event => isProc(t, name, script, 'running', event.proc))
  .then(() => t.context.api.process.listHeapSnapshots(name))
  .then(result => {
    t.truthy(Array.isArray(result))
    t.is(result.length, 2)
  })

})

test('should download a heap dump', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
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
  .then(onProcessEvent('process:snapshot:complete', name, t.context.api))
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

test('should remove a heap dump', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
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
  .then(onProcessEvent('process:snapshot:complete', name, t.context.api))
  .then(event => {
    const snapshots = event.args[0]

    t.truthy(Array.isArray(snapshots))
    t.is(snapshots.length, 2)
    t.context.api.process.removeHeapSnapshot(name, snapshots[0].id)
  })
  // when the snapshot has been removed, make sure we report it as removed
  .then(onProcessEvent('process:snapshot:removed', name, t.context.api))
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

test('should make a process collect garbage', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  // start the process
  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // take a heap snapshot
  .then(() => t.context.api.process.gc(name))
  .then(onProcessEvent('process:gc:complete', name, t.context.api))
  .then(event => isProc(t, name, script, 'running', event.proc))
})

test('should send a signal to a process', t => {
  const script = '/opt/guvnor/test/fixtures/receive-signal.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  // send some signals
  .then(() => t.context.api.process.sendSignal(name, 'SIGUSR1'))
  .then(onProcessEvent('signal:received', name, t.context.api))
  .then(event => t.deepEqual(event.args, ['SIGUSR1']))
})

test('should send a signal to a process and kill it', t => {
  const script = '/opt/guvnor/test/fixtures/receive-signal.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  let workerPid = 0

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
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
    return onProcessEvent('process:worker:started', name, t.context.api)()
  })
  // then list the processes again
  .then(() => t.context.api.process.list())
  .then(procs => procs.find((proc) => proc.name === name))
  .then(proc => {
    // worker's pid should have changed
    t.not(workerPid, proc.workers[0].pid)
  })
})

test('should show logs', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`
  let logs = ''

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.api.logs(line => {
    logs += line + '\n'
  }))
  .then(() => {
    t.truthy(logs.trim())
  })
})

test('should only show logs for one process', t => {
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
    .then(onProcessEvent('process:started', nameOne, t.context.api)),
    t.context.api.process.start(scriptTwo, {
      name: nameTwo,
      workers: 1
    })
    // when it's started
    .then(onProcessEvent('process:started', nameTwo, t.context.api))
  ])
  .then(() => t.context.api.process.logs(nameOne, false, line => {
    logs += line + '\n'
  }))
  .then(() => {
    t.truthy(logs.trim())
    t.is(logs.trim().indexOf('two'), -1)
  })
})

test.todo('should stop the daemon')

test.todo('should print config options')

test.todo('should print config for the web monitor')

test.todo('should list users for the web monitor')

test.todo('should reset users password for the web monitor')

test.todo('should generate ssl certificates')

test('should deploy an application', t => {
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.api.app.install(url)
  .then(() => t.context.api.app.get('http-test'))
  .then(app => {
    t.is(app.url, url)
    t.is(app.name, 'http-test')
  })
})

test('should deploy an application and override name', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, (line) => {})
  .then(() => t.context.api.app.get(name))
  .then(app => {
    t.is(app.url, url)
    t.is(app.name, name)
  })
})

test('should list deployed applications', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, (line) => {})
  .then(() => t.context.api.app.list())
  .then(apps => t.truthy(apps.find(app => app.name === name)))
})

test('should remove deployed applications', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, (line) => {})
  .then(() => t.context.api.app.list())
  .then(apps => t.truthy(apps.find(app => app.name === name)))
  .then(() => t.context.api.app.remove(name))
  .then(() => t.context.api.app.list())
  .then(apps => t.falsy(apps.find(app => app.name === name)))
})

test('should return a 404 for a non-existant app', t => {
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.get(name)
  .catch(error => {
    t.is(error.statusCode, 404)
  })
})

test('should report the current application ref', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, (line) => {})
  .then(() => t.context.api.app.ref(name))
  .then(ref => {
    t.is(ref.name, 'master')
    t.is(ref.type, 'branch')
    t.truthy(ref.commit)
  })
})

test('should list available application refs', t => {
  const url = 'https://github.com/achingbrain/http-test.git'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.api.app.install(url, name, (line) => {})
  .then(() => t.context.api.app.refs(name))
  .then(refs => {
    t.is(refs.length, 5)
    t.is(refs[0].name, 'a-branch')
    t.is(refs[0].type, 'branch')
    t.truthy(refs[0].commit)
  })
})

test.todo('should update application refs')

test.todo('should switch an application ref')

test.todo('should start an app')

test.todo('should add a user')

test.todo('should fail to add a non-existant user')
