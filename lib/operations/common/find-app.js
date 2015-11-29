var config = require('../../daemon/config')
var path = require('path')
var logger = require('winston')
var async = require('async')
var runCommand = require('./run-command')
var toAppDir = require('./to-app-dir')

function startsWith (string, thing) {
  return string.substring(0, thing.length) === thing
}

function without (string, thing) {
  return string.substring(thing.length)
}

function listAppRefs (appDir, callback) {
  var output = ''
  var refs = []

  var branchPrefix = 'refs/heads/'
  var tagPrefix = 'refs/tags/'

  runCommand(config.GIT_PATH, ['show-ref'], appDir, {
    write: function (data) {
      output += data.toString()
    },
    end: function () {

    }
  }, 'Listing app refs failed', function (error) {
    if (!error) {
      output.split('\n').forEach(function (line) {
        var parts = line.trim().split(' ')

        if (parts.length !== 2) {
          return
        }

        var ref = {
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

module.exports = function findApp (user, name, callback) {
  async.auto({
    appDir: toAppDir.bind(null, name),
    version: ['appDir', function (next, results) {
      try {
        var pkgPath = path.join(results.appDir, 'package.json')
        delete require.cache[pkgPath]
        logger.debug('Requiring', pkgPath)
        var pkg = require(pkgPath)

        next(null, pkg.version)
      } catch (error) {
        logger.debug('Could not require', pkgPath, error.message)
        error.code = 'EINVALIDAPP'

        return next(error)
      }
    }],
    refs: ['appDir', function (next, results) {
      listAppRefs(results.appDir, next)
    }],
    ref: ['appDir', 'refs', function (next, results) {
      var output = ''

      runCommand(config.GIT_PATH, ['rev-parse', 'HEAD'], results.appDir, {
        write: function (buffer) {
          output += buffer.toString()
        },
        end: function () {}
      }, 'Finding the current HEAD in ' + results.appDir + ' failed', function (error) {
        var currentRef

        if (!error) {
          var commit = output.trim()

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
    var app

    if (!error) {
      app = {
        name: name,
        path: results.appDir,
        version: results.version,
        ref: results.ref,
        refs: results.refs
      }
    }

    callback(error, app)
  })
}
