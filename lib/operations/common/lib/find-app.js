'use strict'

const config = require('../../../daemon/config')
const path = require('path')
const execFile = require('mz/child_process').execFile
const fs = require('fs-promise')
const operations = require('../../')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:lib:find-app'

function startsWith (string, thing) {
  return string.substring(0, thing.length) === thing
}

function without (string, thing) {
  return string.substring(thing.length)
}

function loadRefs (context, appDir) {
  const branchPrefix = 'refs/heads/'
  const tagPrefix = 'refs/tags/'

  return execFile(config.GIT_PATH, ['show-ref'], {
    cwd: appDir
  })
  .then(result => {
    const refs = []

    result[0].trim().split('\n').forEach((line) => {
      const parts = line.trim().split(' ')

      if (parts.length !== 2) {
        return
      }

      const ref = {
        name: parts[1].trim(),
        commit: parts[0].trim()
      }

      if (startsWith(ref.name, branchPrefix)) {
        ref.type = 'branch'
        ref.name = without(ref.name, branchPrefix)
      }

      if (startsWith(ref.name, tagPrefix)) {
        ref.type = 'tag'
        ref.name = without(ref.name, tagPrefix)
      }

      refs.push(ref)
    })

    return refs
  })
}

const loadVersion = (context, dir) => {
  return new Promise((resolve, reject) => {
    const pkgPath = path.join(dir, 'package.json')

    try {
      delete require.cache[pkgPath]
      context.log([DEBUG, CONTEXT], `Requiring ${pkgPath}`)
      const pkg = require(pkgPath)

      resolve(pkg.version)
    } catch (error) {
      context.log([DEBUG, CONTEXT], `Could not require ${pkgPath}`)
      context.log([DEBUG, CONTEXT], error)

      error.code = 'EINVALIDAPP'

      reject(error)
    }
  })
}

const loadUrl = (context, dir) => {
  return new Promise((resolve, reject) => {
    execFile(config.GIT_PATH, ['config', '--get', 'remote.origin.url'], {
      cwd: dir
    })
    .then(result => result[0].trim())
    .catch(reject)
  })
}

const loadRef = (context, dir, refs) => {
  return new Promise((resolve, reject) => {
    execFile(config.GIT_PATH, ['rev-parse', 'HEAD'], {
      cwd: dir
    })
    .then(result => {
      let currentRef

      const commit = result[0].trim()

      refs.some(function (ref) {
        if (ref.commit === commit) {
          currentRef = ref

          return true
        }
      })

      return currentRef
    })
    .catch(reject)
  })
}

module.exports = function findApp (context, name) {
  return new Promise((resolve, reject) => {
    const app = {
      path: path.resolve(path.join(config.APP_DIR, name)),
      name: name
    }

    // do not allow access outside the app directory
    if (app.path.substring(0, config.APP_DIR.length) !== config.APP_DIR) {
      const error = new Error('Invalid app dir')
      error.code = 'EINVALIDAPPDIR'

      return reject(error)
    }

    // ensure directory exists
    return fs.stat(app.path)
    .then(stats => {
      if (stats && !stats.isDirectory()) {
        const error = new Error('App directory was not a directory')
        error.code = 'EINVALIDAPP'

        throw error
      }

      return Promise.all([
        operations.findUserDetails(context, stats.uid)
        .then(user => {
          app.user = user.name
        }),
        operations.findGroupDetails(context, stats.gid)
        .then(group => {
          app.user = group.name
        })
      ])
    })
    .then(() => Promise.all([
      loadVersion(context, app.path)
      .then(version => {
        app.version = version
      }),
      loadUrl(context, app.path)
      .then(url => {
        app.url = url
      }),
      loadRefs(context, app.path)
      .then(refs => {
        app.refs = refs

        return loadRef(context, app.path, refs)
        .then(ref => {
          app.ref = ref
        })
      })
    ]))
    .then(() => resolve(app))
    .catch(reject)
  })
}
