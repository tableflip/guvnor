'use strict'

const test = require('ava')
const faker = require('faker')
const cli = require('./fixtures/cli')
const api = require('./fixtures/api')
const utils = require('./fixtures/utils')
const winston = require('winston')

if (!process.env.QUIET) {
  winston.level = 'debug'
}

winston.cli()

test.beforeEach(t => {
  t.context._procNames = []
  t.context.procName = () => {
    const name =  `${faker.lorem.word()}_${faker.lorem.word()}_${faker.lorem.word()}_${faker.lorem.word()}`
    t.context._procNames.push(name)

    return name
  }

  return Promise.all([
    cli.then(cli => {
      t.context.cli = cli
    }),
    api.then(api => {
      t.context.api = api
    })
  ])
})

test.afterEach(t => {
  //t.context.api.disconnect()
})

test('Should return a process list', t => {
  return t.context.cli(['list'])
  .then(stdout => {
    t.truthy(stdout.trim())
  })
})

test('Should return a process list as JSON', t => {
  return t.context.cli(['list', '--json'])
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => t.is(Array.isArray(procs), true))
})

test('Should start a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(['start', script, '-n', name])
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} started`) > -1))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('Should stop a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(['start', script, '-n', name])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['stop', name]))
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} stopped`) > -1))
  .then(utils.onProcessEvent('process:stopped', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'stopped', proc))
})

test('Should remove a stopped process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(['start', script, '-n', name])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['stop', name]))
  .then(utils.onProcessEvent('process:stopped', name, t.context.api))
  .then(() => t.context.cli(['remove', name]))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.falsy(proc))
})

test('Should remove a running process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(['start', script, '-n', name])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['remove', name]))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.falsy(proc))
})

test('Should restart a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(['start', script, '-n', name])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['restart', name]))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('Should start a process with arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()
  const argv = ['one', 'two', 'three']

  return t.context.cli(['start', script, '-n', name, '-a', argv.join(' ')])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.deepEqual(proc.master.argv.slice(2), argv))
})

test('Should start a process with arguments passed without delimiters', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()
  const argv = ['one', 'two', 'three']

  return t.context.cli(['start', script, '-n', name, '-a', argv[0], argv[1], argv[2]])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.deepEqual(proc.master.argv.slice(2), argv))
})

test.skip('Should start a process with exec arguments', t => {
  // see https://github.com/yargs/yargs/issues/360
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()
  const execArgv = ['--log_gc', '--trace_code_flushing', '--trace_stub_failures']

  return t.context.cli(['start', script, '-n', name, '-e', execArgv.join(' ')])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.deepEqual(proc.master.execArgv.slice(2), execArgv))
})

test('Should increase number of cluster workers', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  // check that we can actually run this test..
  return t.context.api.status()
  .then(status => {
    if (status.cpus.length < 2) {
      console.warn('!!!!!! There are not enough CPUs available to run process worker tests')
      return t.pass()
    }

    // start the process
    return t.context.cli(['start', script, '-n', name, '-w', '1'])
    // when it's started
    .then(utils.onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 1))
    .then(() => {
      t.context.cli(['workers', name, '2'])

      // when the new worker starts
      return utils.onProcessEvent('process:worker:started', name, t.context.api)()
    })
    // make sure the number of workers are alive
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => {
      t.is(proc.workers.length, 2)
    })
  })
})

test('Should decrease number of cluster workers', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  // check that we can actually run this test..
  return t.context.api.status()
  .then(status => {
    if (status.cpus.length < 2) {
      console.warn('!!!!!! There are not enough CPUs available to run process worker tests')
      return t.pass()
    }

    // start the process
    return t.context.cli(['start', script, '-n', name, '-w', '2'])
    // when it's started
    .then(utils.onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 2))
    .then(() => {
      t.context.cli(['workers', name, '1'])

      // when the new worker stops
      return utils.onProcessEvent('process:worker:exit', name, t.context.api)()
    })
    // make sure the number of workers are alive
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => {
      t.is(proc.workers.length, 1)
    })
  })
})

test('Should send an event to a process', t => {
  const script = '/opt/guvnor/test/fixtures/receive-event.js'
  const name = t.context.procName()
  const args = ['arg1', 'arg2', 'arg3']

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // send an event
  .then(() => t.context.cli(['send', name, 'custom:event:sent', 'arg1', 'arg2', 'arg3']))
  // when we get a response
  .then(utils.onProcessEvent('custom:event:received', name, t.context.api))
  // should have echoed our args back to us
  .then(event => t.deepEqual(event.args, args))
})

test('Should send a signal to a process', t => {
  const script = '/opt/guvnor/test/fixtures/receive-signal.js'
  const name = t.context.procName()

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // send a signal
  .then(() => t.context.cli(['signal', name, 'SIGUSR1']))
  // when we get a response
  .then(utils.onProcessEvent('signal:received', name, t.context.api))
  // should have echoed our args back to us
  .then(event => t.deepEqual(event.args, ['SIGUSR1']))
})

test('Should make a process dump heap', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // send a signal
  .then(() => t.context.cli(['heap', name]))
  // when we get a response
  .then(stdout => t.regex(stdout, /took a heap snapshot/g))
})

test('Should make a process collect garbage', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // send a signal
  .then(() => t.context.cli(['gc', name]))
  // when we get a response
  .then(stdout => t.regex(stdout, /collected garbage/g))
})

test.skip('Should show logs', t => {

})

test('Should only show logs for one process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // send a signal
  .then(() => t.context.cli(['logs', name]))
  // when we get a response
  .then(stdout => t.regex(stdout, new RegExp(`Process logs for ${name}`, 'g')))
})

test('Should report daemon status', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(['status'])
  .then(stdout => t.regex(stdout, /Daemon is running/))
})

test('Should set up certificates for a user', t => {
  return t.context.cli(['adduser', 'guvnor-user-4'])
  .then(stdout => t.regex(stdout, /User guvnor-user-4 added/))
})

test('Should not set up certificates for a user twice', t => {
  return t.context.cli(['adduser', 'guvnor-user-5'])
  .then(stdout => t.regex(stdout, /User guvnor-user-5 added/))
  .then(() => t.context.cli(['adduser', 'guvnor-user-5']))
  .then(stdout => t.regex(stdout, /A certificate already exists for that user/))
})

test.skip('Should remove certificates for a user', t => {
  return t.context.cli(['adduser', 'guvnor-user-6'])
  .then(stdout => t.regex(stdout, /User guvnor-user-6 added/))
  .then(() => t.context.cli(['rmuser', 'guvnor-user-6']))
  .then(stdout => t.regex(stdout, /User guvnor-user-6 removed/))
})

test.skip('Should not create certificates for a non-existant user', t => {

})

test('Should not remove certificates for a non-existant user', t => {
  return t.context.cli(['adduser', 'guvnor-user-4'])
  .then(stdout => t.regex(stdout, /No user was found with the name guvnor-user-4/))
})

test.skip('Should not show installed apps', t => {
  runCli(['lsapps'], 1, done, function (stdout) {
    expect(stdout.trim()).to.equal('')
  })
})

test.skip('Should deploy an application', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    expect(stdout.trim()).to.contain('Installed http-test from https://github.com/achingbrain/http-test.git')
  })
})

test.skip('Should deploy an application and override name', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git', '-n', 'foo'], 6, done, function (stdout) {
    expect(stdout.trim()).to.contain('Installed foo from https://github.com/achingbrain/http-test.git')
  })
})

test.skip('Should list deployed applications', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    runCli(['lsapps', '--json'], 1, done, function (stdout) {
      var apps = JSON.parse(stdout)
      expect(apps.length).to.equal(1)
      expect(apps[0].name).to.equal('http-test')
    })
  })
})

test.skip('Should remove deployed applications', t => {
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

test.skip('Should report the current application ref', t => {
  runCli(['install', 'https://github.com/achingbrain/http-test.git'], 6, done, function (stdout) {
    runCli(['lsref', 'http-test', '--json'], 1, done, function (stdout) {
      var ref = JSON.parse(stdout)

      expect(ref.name).to.equal('master')
      expect(ref.type).to.equal('branch')
      expect(ref.commit).to.be.ok
    })
  })
})

test.skip('Should list available application refs', t => {
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

test.skip('Should update application refs', t => {

})

test.skip('Should switch an application ref', t => {

})

test.skip('Should start an app', t => {

})

test.todo('Should stop the daemon')
