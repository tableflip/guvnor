'use strict'

const path = require('path')
const fs = require('fs-promise')
const retry = require('./retry')
const logger = require('winston')

const DOCKER_FILE_DIRECTORY = path.resolve(path.join(__dirname, '..', '..', '..'))

module.exports.printVersion = (runner) => {
  logger.debug('Printing the docker version')
  return runner([
    'docker', '--version'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
}

module.exports.fetchCACertificate = (runner, id) => {
  logger.debug('Fetching the CA certificate')
  return retry(() => runner([
    'docker', 'exec', id, 'cat', '/etc/guvnor/ca.crt'
  ]), 10, 1000)
}

module.exports.fetchRootCertificate = (runner, id) => {
  logger.debug('Fetching the root certificate')
  return retry(() => runner([
    'docker', 'exec', id, 'cat', '/root/.config/guvnor/root.pub'
  ]), 10, 1000)
}

module.exports.fetchRootKey = (runner, id) => {
  logger.debug('Fetching the root key')
  return retry(() => runner([
    'docker', 'exec', id, 'cat', '/root/.config/guvnor/root.key'
  ]), 10, 1000)
}

module.exports.attachLogger = (runner, id) => {
  logger.debug('Attaching a logger')
  return runner([
    //'docker', 'logs', id, '-f'
    'docker', 'exec', id, 'journalctl', '-u', 'guvnor.service', '-f'
  ], {
    ignoreExit: true
  })
}

module.exports.buildDaemon = (runner) => {
  logger.debug('Building the daemon')
  return runner([
    'docker', 'build', '-f', 'Dockerfile-guvnor-tests', '-t', 'daemon', '.'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
}

module.exports.startDaemon = (runner) => {
  logger.debug('Starting the daemon')
  return runner([
    'docker', 'run', '--privileged', '--cap-add', 'SYS_ADMIN', '-it',
    '-v', '/run', '-v', '/run/lock', '-v', '/sys/fs/cgroup:/sys/fs/cgroup:ro',
    '-p', '8000:8000', '-p', '8001:8001', '-p', '8002:8080' // , '-d', 'daemon'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
  .then((id) => {
    return id.trim()
  })
}

module.exports.takeHeapSnapshot = (runner, id) => {
  if (process.env.COVERAGE) { // set in package.json
    logger.debug('Not taking a heap snapshot as coverage is enabled')

    return Promise.resolve()
  }

  if (!process.env.TRACK_HEAP) { // set in package.json
    logger.debug('Not taking a heap snapshot as TRACK_HEAP was not set in the environment')

    return Promise.resolve()
  }

  logger.debug('Taking a heap snapshot')

  return runner([
    'docker', 'exec', id, 'pidof', 'node'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
  .then(result => result.trim().split(' ').reduce((last, current) => current > last ? current : last, 0))
  .then(pid => runner([
    'docker', 'exec', id, 'kill', '-USR2', pid
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  }))
}

module.exports.listContainers = (runner) => {
  logger.debug('Listing docker containers')
  return runner([
    'docker', 'ps', '-aq'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
  .then((stdin) => {
    return stdin.split('\n').map((s) => s.trim()).filter((s) => !!s)
  })
}

module.exports.stopContainers = (runner) => {
  logger.debug('Stopping all docker containers')
  return module.exports.listContainers(runner)
  .then(containers => {
    if (containers.length === 0) {
      logger.debug('No containers to stop')
      return
    }

    logger.debug(`Stopping ${containers.length} docker containers`)

    return runner([
      'docker', 'stop'
    ].concat(containers), {
      cwd: DOCKER_FILE_DIRECTORY
    })
  })
}

module.exports.removeContainers = (runner) => {
  logger.debug('Removing all docker processes')
  return module.exports.listContainers(runner)
  .then(containers => {
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

module.exports.findContainer = (runner) => {
  logger.debug('Finding docker containers')
  return module.exports.listContainers(runner)
  .then(containers => {
    if (containers.length > 1) {
      throw new Error('Multiple containers found')
    }

    return containers.pop()
  })
}

module.exports.printLogs = (runner, id) => {
  logger.debug('')
  logger.debug('---- Start test logs -----')
  logger.debug('')

  return runner([
    'docker', 'exec', id, 'journalctl', '-u', 'guvnor.service'
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
  .then(() => {
    logger.debug('')
    logger.debug('---- End test logs -----')
    logger.debug('')
  })
}

module.exports.removeCoverageDirectory = () => {
  if (!process.env.COVERAGE) { // set in package.json
    logger.debug('Not removing coverage directory')

    return Promise.resolve()
  }

  logger.debug('Removing coverage directory')

  const projectDir = path.resolve(path.join(__dirname, '../../../'))
  const nycTmpDir = path.join(projectDir, '.nyc_output')

  return fs.remove(nycTmpDir)
}

module.exports.fetchCoverage = (runner, id) => {
  if (!process.env.COVERAGE) { // set in package.json
    logger.debug('Not fetching coverage')

    return Promise.resolve()
  }

  logger.debug('Fetching coverage')

  const projectDir = path.resolve(path.join(__dirname, '../../../'))
  const nycTmpDir = path.join(projectDir, '.nyc_output')
  const libDir = path.join(projectDir, 'lib')

  return fs.ensureDir(nycTmpDir)
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
        logger.debug(`Fetching coverage file ${coverageFile}`)

        // cat it
        return runner([
          'docker', 'exec', id, 'cat', `/opt/guvnor/.nyc_output/${coverageFile}`
        ], {
          cwd: DOCKER_FILE_DIRECTORY,
          hideOutput: true
        })
        .then(coverageFileContents => {
          logger.debug(`Reading coverage`)

          // rewrite coverage with correct file paths
          const coverage = JSON.parse(coverageFileContents)

          logger.debug(`Replacing coverage keys`)

          Object.keys(coverage).forEach(key => {
            const file = coverage[key]
            delete coverage[key]
            key = key.replace('/opt/guvnor', projectDir)
            file.path = file.path.replace('/opt/guvnor', projectDir)
            coverage[key] = file
          })

          const modifiedCoverageFile = path.join(nycTmpDir, coverageFile)

          logger.debug(`Writing coverage out to ${modifiedCoverageFile}`)

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

module.exports.copyFile = (runner, id, source, destination) => {
  return runner([
    'docker', 'cp', `${id}:${source}`, destination
  ], {
    cwd: DOCKER_FILE_DIRECTORY
  })
}
