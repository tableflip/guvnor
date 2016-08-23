'use strict'

const path = require('path')
const Wreck = require('wreck')
const runner = require('./runner')
const retry = require('./retry')
const test = require('ava')
const os = require('os')
const DOCKER_FILE_DIRECTORY = path.resolve(path.join(__dirname, '..', '..', '..'))
const loadApi = require('../../../lib/local')

const printVersion = (runner) => {
  return runner([
    'docker', '--version'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
}

const fetchCACertificate = (runner, id) => {
  return retry(() => runner([
    'docker', 'exec', id, 'cat', '/etc/guvnor/ca.crt'
  ]), 10, 1000)
}

const fetchRootCertificate = (runner, id) => {
  return retry(() => runner([
    'docker', 'exec', id, 'cat', '/root/.config/guvnor/root.pub'
  ]), 10, 1000)
}

const fetchRootKey = (runner, id) => {
  return retry(() => runner([
    'docker', 'exec', id, 'cat', '/root/.config/guvnor/root.key'
  ]), 10, 1000)
}

const attachLogger = (runner, id) => {
  return runner([
    //'docker', 'logs', id, '-f'
    'docker', 'exec', id, 'journalctl', '-u', 'guvnor.service', '-f'
  ], {
    ignoreExit: true
  })
}

const buildDaemon = (runner) => {
  return runner([
    'docker', 'build', '-f', 'Dockerfile-guvnor-tests', '-t', 'daemon', '.'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
}

const startDaemon = (runner) => {
  return runner([
    'docker', 'run', '--privileged', '--cap-add', 'SYS_ADMIN', '-it',
    '-v', '/run', '-v', '/run/lock', '-v', '/sys/fs/cgroup:/sys/fs/cgroup:ro',
    '-p', '8000:8000', '-p', '8001:8001', '-p', '8002:8080', '-d', 'daemon'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
  .then((id) => {
    return id.trim()
  })
}

const listContainers = (runner) => {
  console.info('Listing docker containers')
  return runner([
    'docker', 'ps', '-aq'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
  .then((stdin) => {
    return stdin.split('\n').map((s) => s.trim()).filter((s) => !!s)
  })
}

const stopContainers = (runner) => {
  console.info('Stopping all docker processes')
  return listContainers(runner)
  .then((containers) => {
    if (containers.length === 0) {
      return
    }

    return runner([
      'docker', 'stop'
    ].concat(containers), {
      cwd: DOCKER_FILE_DIRECTORY
    })
  })
}

const removeContainers = (runner) => {
  console.info('Removing all docker processes')
  return listContainers(runner)
  .then((containers) => {
    if (containers.length === 0) {
      return
    }

    return runner([
      'docker', 'rm'
    ].concat(containers), {
      cwd: DOCKER_FILE_DIRECTORY
    })
  })
}

module.exports = runner()
.then((runner) => {
  return printVersion(runner)
  .then(() => stopContainers(runner))
  .then(() => removeContainers(runner))
  .then(() => buildDaemon(runner))
  .then(() => startDaemon(runner))
  .then((id) => {
    module.exports.printLogs = () => {
      return runner([
        'docker', 'exec', id, 'journalctl', '-u', 'guvnor.service'
      ], {
        cwd: DOCKER_FILE_DIRECTORY
      })
    }

    return attachLogger(runner, id)
    .then(() => {
      return Promise.all([
        fetchCACertificate(runner, id),
        fetchRootCertificate(runner, id),
        fetchRootKey(runner, id)
      ])
      .then((results) => {
        return loadApi({
          ca: results[0],
          cert: results[1],
          key: results[2]
        })
      })
    })
  })
})
