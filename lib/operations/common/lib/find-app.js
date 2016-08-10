'use strict'

const config = require('../../../daemon/config')
const path = require('path')
const async = require('async')
const runCommand = require('./run-command')
const fs = require('fs')
const operations = require('../../')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:lib:find-app'

function startsWith (string, thing) {
  return string.substring(0, thing.length) === thing
}

function without (string, thing) {
  return string.substring(thing.length)
}

function listAppRefs (appDir, callback) {
  const output = ''
  const refs = []

  const branchPrefix = 'refs/heads/'
  const tagPrefix = 'refs/tags/'

  runCommand(config.GIT_PATH, ['show-ref'], appDir, {
    write: function (data) {
      output += data.toString()
    },
    end: function () {

    }
  }, 'Listing app refs failed', function (error) {
    if (!error) {
      output.split('\n').forEach(function (line) {
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
    }

    callback(error, refs)
  })
}

module.exports = function findApp (context, name, callback) {
  const app = {
    path: path.resolve(path.join(config.APP_DIR, name)),
    name: name
  }

  // do not allow access outside the app directory
  if (app.path.substring(0, config.APP_DIR.length) !== config.APP_DIR) {
    const error = new Error('Invalid app dir')
    error.code = 'EINVALIDAPPDIR'

    return callback(error)
  }

  async.auto({
    app: function (next) {
      // ensure directory exists
      fs.stat(app.path, function (error, stats) {
        if (stats && !stats.isDirectory()) {
          error = new Error('App directory was not a directory')
          error.code = 'EINVALIDAPP'
        }

        if (error) {
          if (error.code === 'ENOENT') {
            error = new Error('No app directory found')
            error.code = 'ENOAPP'
          }

          return next(error)
        }

        async.parallel({
          user: operations.findUserDetails.bind(null, context, stats.uid),
          group: operations.findGroupDetails.bind(null, context, stats.gid)
        }, function (error, results) {
          if (!error) {
            app.user = results.user.name
            app.group = results.group.name
          }

          next(error, app)
        })
      })
    },
    version: ['app', function (results, next) {
      const pkgPath = path.join(results.app.path, 'package.json')

      try {
        delete require.cache[pkgPath]
        context.log([DEBUG, CONTEXT], `Requiring ${pkgPath}`)
        const pkg = require(pkgPath)

        next(null, pkg.version)
      } catch (error) {
        context.log([DEBUG, CONTEXT], `Could not require ${pkgPath}`)
        context.log([DEBUG, CONTEXT], error)

        error.code = 'EINVALIDAPP'

        return next(error)
      }
    }],
    url: ['app', function (results, next) {
      let output = ''

      runCommand(config.GIT_PATH, ['config', '--get', 'remote.origin.url'], results.app.path, {
        write: function (buffer) {
          output += buffer.toString()
        },
        end: function () {}
      }, `Finding the fetch url ${results.app.path} failed`, function (error) {
        next(error, output.trim())
      })
    }],
    refs: ['app', function (results, next) {
      listAppRefs(results.app.path, next)
    }],
    ref: ['app', 'refs', function (results, next) {
      let output = ''

      runCommand(config.GIT_PATH, ['rev-parse', 'HEAD'], results.app.path, {
        write: function (buffer) {
          output += buffer.toString()
        },
        end: function () {}
      }, `Finding the current HEAD in ${results.app.path} failed`, function (error) {
        let currentRef

        if (!error) {
          const commit = output.trim()

          results.refs.some(function (ref) {
            if (ref.commit === commit) {
              currentRef = ref

              return true
            }
          })
        }

        next(error, currentRef)
      })
    }]
  }, function (error, results) {
    if (!error) {
      results.app.version = results.version
      results.app.url = results.url
      results.app.refs = results.refs
      results.app.ref = results.ref
    }

    callback(error, results.app)
  })
}
