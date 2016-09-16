'use strict'

const test = require('ava')
const faker = require('faker')
const daemon = require('./fixtures/daemon')
const commands = require('./fixtures/commands')
const cli = require('./fixtures/cli')
const api = require('./fixtures/api')
const utils = require('./fixtures/utils')
const winston = require('winston')
const fs = require('fs-promise')
const pem = require('pem-promise')
const path = require('path')
const loadApi = require('../../lib/local')

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

  t.context._appNames = []
  t.context.appName = () => {
    const name =  `${faker.lorem.word()}_${faker.lorem.word()}_${faker.lorem.word()}_${faker.lorem.word()}`
    t.context._appNames.push(name)

    return name
  }

  t.context.commands = commands

  return Promise.all([
    cli.then(cli => {
      t.context.cli = cli
    }),
    api.then(api => {
      t.context.api = api
    }),
    daemon.then(result => {
      t.context.runner = result.runner
      t.context.id = result.id
    })
  ])
})

test.afterEach(t => {
  //t.context.api.disconnect()
})

test('Should return a process list', t => {
  return t.context.cli('guv list')
  .then(stdout => {
    t.truthy(stdout.trim())
  })
})

test('Should return an app list', t => {
  return t.context.cli('guv lsapps')
  .then(stdout => {
    t.truthy(stdout.trim())
  })
})

test('Should return a process list as JSON', t => {
  return t.context.cli('guv list --json')
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => t.is(Array.isArray(procs), true))
})

test('Should start a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(`guv start ${script} -n ${name}`)
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} started`) > -1))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('Should stop a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(`guv start ${script} -n ${name}`)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(`guv stop ${name}`))
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} stopped`) > -1))
  .then(utils.onProcessEvent('process:stopped', name, t.context.api))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'stopped', proc))
})

test('Should remove a stopped process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(`guv start ${script} -n ${name}`)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(`guv stop ${name}`))
  .then(utils.onProcessEvent('process:stopped', name, t.context.api))
  .then(() => t.context.cli(`guv remove ${name}`))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.falsy(proc))
})

test('Should remove a running process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(`guv start ${script} -n ${name}`)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(`guv remove ${name}`))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.falsy(proc))
})

test('Should restart a process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.cli(`guv start ${script} -n ${name}`)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(`guv restart ${name}`))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('Should start a process with arguments', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()
  const argv = ['one', 'two', 'three']

  return t.context.cli(`guv start ${script} -n ${name} -a ${argv[0]} -a ${argv[1]} -a ${argv[2]}`)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.deepEqual(proc.master.argv.slice(2), argv))
})

test('Should start a process with arguments passed without delimiters', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()
  const argv = ['one', 'two', 'three']

  return t.context.cli(`guv start ${script} -n ${name} -a ${argv[0]} ${argv[1]} ${argv[2]}`)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => t.deepEqual(proc.master.argv.slice(2), argv))
})

test.skip('Should start a process with exec arguments', t => {
  // see https://github.com/yargs/yargs/issues/360
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()
  const execArgv = ['--log_gc', '--trace_code_flushing', '--disable_old_api_accessors']

  return t.context.cli(`guv start ${script} -n ${name} -e ${execArgv[0]} ${execArgv[1]} ${execArgv[2]}`)
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli('guv list --json'))
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
    return t.context.cli(`guv start ${script} -n ${name} -w 1`)
    // when it's started
    .then(utils.onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 1))
    .then(() => {
      t.context.cli(`guv workers ${name} 2`)

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
    return t.context.cli(`guv start ${script} -n ${name} -w 2`)
    // when it's started
    .then(utils.onProcessEvent('process:started', name, t.context.api))
    .then(() => t.context.api.process.list())
    .then(procs => procs.find((proc) => proc.name === name))
    .then(proc => t.is(proc.workers.length, 2))
    .then(() => {
      t.context.cli(`guv workers ${name} 1`)

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
  .then(() => t.context.cli(`guv send ${name} custom:event:sent arg1 arg2 arg3`))
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
  .then(() => t.context.cli(`guv signal ${name} SIGUSR1`))
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
  .then(() => t.context.cli(`guv heap ${name}`))
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
  .then(() => t.context.cli(`guv gc ${name}`))
  // when we get a response
  .then(stdout => t.regex(stdout, /collected garbage/g))
})

test.skip('Should show logs', t => {

})

test.skip('Should only show logs for one process', t => {
  const script = '/opt/guvnor/test/fixtures/hello-world.js'
  const name = t.context.procName()

  return t.context.api.process.start(script, {
    name: name,
    workers: 1
  })
  // when it's started
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  // send a signal
  .then(() => t.context.cli(`guv logs ${name}`))
  // when we get a response
  .then(stdout => t.regex(stdout, new RegExp(`Process logs for ${name}`, 'g')))
})

test('Should set up certificates for a user', t => {
  return t.context.cli('guv adduser guvnor-user-4')
  .then(stdout => t.regex(stdout, /User guvnor-user-4 added/))
})

test('Should not set up certificates for a user twice', t => {
  return t.context.cli('guv adduser guvnor-user-5')
  .then(stdout => t.regex(stdout, /User guvnor-user-5 added/))
  .then(() => t.context.cli('guv adduser guvnor-user-5'))
  .catch(error => t.regex(error.stdout, /A certificate already exists for that user/))
})

test('Should remove certificates for a user', t => {
  return t.context.cli('guv adduser guvnor-user-6')
  .then(stdout => t.regex(stdout, /User guvnor-user-6 added/))
  .then(() => t.context.cli('guv rmuser guvnor-user-6'))
  .then(stdout => t.regex(stdout, /User guvnor-user-6 removed/))
})

test('Should not create certificates for a non-existant user', t => {
  return t.context.cli('guv adduser i-do-not-exist')
  .catch(error => t.regex(error.stdout, /No user was found with the name i-do-not-exist/))
})

test('Should not remove certificates for a non-existant user', t => {
  return t.context.cli('guv rmuser i-do-not-exist')
  .catch(error => t.regex(error.stdout, /No user was found with the name i-do-not-exist/))
})

test('Should list deployed applications', t => {
  return t.context.cli('guv lsapps --json')
  .then(stdout => JSON.parse(stdout))
  .then(apps => t.truthy(Array.isArray(apps)))
})

test('Should deploy an application', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(stdout => t.truthy(stdout.includes(`Installed ${name} from ${url}`)))
  .then(() => t.context.cli('guv lsapps --json'))
  .then(stdout => JSON.parse(stdout))
  .then(apps => t.truthy(apps.some(app => app.name === name)))
})

test('Should remove deployed applications', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli('guv lsapps --json'))
  .then(stdout => JSON.parse(stdout))
  .then(apps => t.truthy(apps.some(app => app.name === name)))
  .then(() => t.context.cli(`guv rmapp ${name}`))
  .then(stdout => t.is(stdout, `Removed app ${name}`))
  .then(() => t.context.cli('guv lsapps --json'))
  .then(stdout => JSON.parse(stdout))
  .then(apps => t.falsy(apps.some(app => app.name === name)))
})

test('Should report the current application ref as JSON', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv lsref ${name} --json`))
  .then(stdout => JSON.parse(stdout))
  .then(ref => {
    t.is(ref.name, 'master')
    t.is(ref.type, 'branch')
    t.truthy(ref.commit)
  })
})

test('Should report the current application ref', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv lsref ${name}`))
  .then(stdout => {
    t.not(stdout.indexOf('master'), -1)
    t.not(stdout.indexOf('branch'), -1)
  })
})

test('Should list available application refs as JSON', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv lsrefs ${name} --json`))
  .then(stdout => JSON.parse(stdout))
  .then(refs => {
    t.is(refs.length, 5)
    t.is(refs[0].name, 'a-branch')
    t.is(refs[0].type, 'branch')
    t.truthy(refs[0].commit)
  })
})

test('Should list available application refs', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv lsrefs ${name}`))
  .then(stdout => {
    t.not(stdout.indexOf('a-branch'), -1)
  })
})

test('Should update application refs', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv update ${name} --json`))
  .then(stdout => t.regex(stdout, new RegExp(`Updated ${name}`)))
})

test('Should switch an application ref', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv lsref ${name} --json`))
  .then(stdout => JSON.parse(stdout))
  .then(ref => {
    t.is(ref.name, 'master')
    t.is(ref.type, 'branch')
    t.truthy(ref.commit)
  })
  .then(() => t.context.cli(`guv setref ${name} a-branch`))
  .then(stdout => t.truthy(stdout.includes(`Set ${name} ref to a-branch`)))
  .then(() => t.context.cli(`guv lsref ${name} --json`))
  .then(stdout => JSON.parse(stdout))
  .then(ref => {
    t.is(ref.name, 'a-branch')
    t.is(ref.type, 'branch')
    t.truthy(ref.commit)
  })
})

test('Should start an app', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv start ${name}`))
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} started`) > -1))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli('guv list --json'))
  .then(stdout => JSON.parse(stdout))
  .then(procs => procs.find(proc => proc.name === name))
  .then(proc => utils.isProc(t, name, 'running', proc))
})

test('Should not start an app twice', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv start ${name}`))
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} started`) > -1))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(`guv start ${name}`))
  .catch(error => t.is(error.stdout, `${name} is already running`))
})

test('Should not update application refs for a running app', t => {
  const name = t.context.appName()
  const url = 'https://github.com/achingbrain/http-test.git'

  return t.context.cli(`guv install ${url} -n ${name}`)
  .then(() => t.context.cli(`guv start ${name}`))
  .then(stdout => t.truthy(stdout.indexOf(`Process ${name} started`) > -1))
  .then(utils.onProcessEvent('process:started', name, t.context.api))
  .then(() => t.context.cli(`guv update ${name}`))
  .catch(error => t.is(error.stdout, `App ${name} was running`))
})

test('Should report daemon status', t => {
  return t.context.cli('guv status')
  .then(stdout => t.regex(stdout, /Daemon is running/))
})

test('Should create certificate file for web interface', t => {
  const password = 'foobar'

  return t.context.cli(`guv webkey -p ${password}`)
  .then(stdout => {
    t.regex(stdout, /Created (.*).p12/)
    const p12Path = stdout.split('Created ')[1]
    const p12File = p12Path.split('/').pop()
    const targetPath = path.resolve(path.join(__dirname, '..', '..', 'lib', p12File))

    return t.context.commands.copyFile(
      t.context.runner,
      t.context.id,
      p12Path,
      'DAEMON_PATH/lib'
    )
    .then(() => pem.readPkcs12(targetPath, {
        p12Password: password
    }))
  })
  .then(certs => loadApi(certs))
  .then(api => api.process.list())
  .then(processes => t.truthy(Array.isArray(processes)))
})

test.todo('Should start the daemon')

test.todo('Should stop the daemon')
