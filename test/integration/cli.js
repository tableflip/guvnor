'use strict'

const test = require('ava')
const faker = require('faker')
const cli = require('./fixtures/cli')
const api = require('./fixtures/api')
const utils = require('./fixtures/utils')
const winston = require('winston')
winston.level = 'debug'
winston.cli()

test.beforeEach(t => {
  return Promise.all([
    cli.then(cli => {
      t.context.cli = cli
    }),
    api.then(api => {
      t.context.api = api
    })
  ])
})

test('CLI should return a process list', t => {
  return t.context.cli(['list'])
  .then(stdout => {
    t.truthy(stdout.trim())
  })
})

test('CLI should return a process list as JSON', t => {
  return t.context.cli(['list', '--json'])
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => t.is(Array.isArray(procs), true))
})

test('CLI should start a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.cli(['start', script, '-n', name])
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} started`) > -1))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('CLI should stop a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

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

test('CLI should remove a stopped process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

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

test('CLI should remove a running process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.cli(['start', script, '-n', name])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['remove', name]))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.falsy(proc))
})

test('CLI should restart a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.cli(['start', script, '-n', name])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['restart', name]))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('CLI should start a process with arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = `${faker.lorem.word()}_${faker.lorem.word()}`

  return t.context.cli(['start', script, '-n', name, '-a', 'one two three'])
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['restart', name]))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(['list', '--json']))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.deepEqual(proc.master.argv.slice(2), ['one', 'two', 'three']))
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
