'use strict'

const path = require('path')
const Wreck = require('wreck')
const runner = require('./runner')
const retry = require('./retry')
const test = require('ava')
const os = require('os')
const DOCKER_FILE_DIRECTORY = path.resolve(path.join(__dirname, '..', '..', '..'))
const logger = require('winston')
const fs = require('fs-promise')

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

const takeHeapSnapshot = (runner, id) => {
  return runner([
    'docker', 'exec', id, 'pidof', 'node'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
  .then(result => result.trim().split(' ').reduce((last, current) => current > last ? current : last, 0))
  .then(pid => runner([
    'docker', 'exec', id, 'kill', '-s', 'USR2', pid
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  }))
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

    module.exports.fetchCoverage = () => {
      if (!process.env.COVERAGE) { // set in package.json
        return
      }

      const projectDir = path.resolve(path.join(__dirname, '../../../'))
      const nycTmpDir = path.join(projectDir, '.nyc_output')
      const libDir = path.join(projectDir, 'lib')

      // make the nyc temp dir if it doesn't exist already
      return fs.remove(nycTmpDir)
      .then(() => fs.ensureDir(nycTmpDir))
      // stop the daemon so it writes coverage info out
      .then(() => runner([
        'docker', 'exec', id, 'systemctl', 'stop', 'guvnor.service'
      ], {
        cwd: DOCKER_FILE_DIRECTORY
      }))
      // find the new coverage file
      .then(() => runner([
        'docker', 'exec', id, 'ls', '/opt/guvnor/.nyc_output'
      ], {
        cwd: DOCKER_FILE_DIRECTORY
      }))
      .then(coverageFiles => {
        const files = coverageFiles.trim().split('\n').map(coverageFile => {
            coverageFile = coverageFile.trim()

            return () => {
              console.info(`Fetching coverage file ${coverageFile}`)

              // cat it
              return runner([
                'docker', 'exec', id, 'cat', `/opt/guvnor/.nyc_output/${coverageFile}`
              ], {
                cwd: DOCKER_FILE_DIRECTORY,
                hideOutput: true
              })
              .then(coverageFileContents => {
                console.info(`Reading coverage`)

                // rewrite coverage with correct file paths
                const coverage = JSON.parse(coverageFileContents)

                console.info(`Replacing coverage keys`)

                Object.keys(coverage).forEach(key => {
                  const file = coverage[key]
                  delete coverage[key]
                  key = key.replace('/opt/guvnor', projectDir)
                  file.path = file.path.replace('/opt/guvnor', projectDir)
                  coverage[key] = file
                })

                const modifiedCoverageFile = path.join(nycTmpDir, coverageFile)

                console.info(`Writing coverage out to ${modifiedCoverageFile}`)

                // put the coverage file in the local directory
                return fs.writeFile(modifiedCoverageFile, JSON.stringify(coverage, null, 2), {
                  encoding: 'utf8'
                })
              })
            }
          })

        return files.reduce((pacc, fn) => pacc.then(fn), Promise.resolve())
      })
    }

    module.exports.takeHeapSnapshot = () => {
      return takeHeapSnapshot(runner, id)
    }

    return Promise.all([
      fetchCACertificate(runner, id),
      fetchRootCertificate(runner, id),
      fetchRootKey(runner, id)
    ])
    .then(results => takeHeapSnapshot(runner, id).then(() => results))
    .then(results => {
      return {
        ca: results[0],
        certificate: results[1],
        key: results[2]
      }
    })
  })
})
