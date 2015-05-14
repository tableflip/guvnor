var async = require('async')
var runCommand = require('./run-command')
var config = require('../../daemon/config')
var toAppDir = require('./to-app-dir')

function startsWith (string, thing) {
  return string.substring(0, thing.length) === thing
}

function without (string, thing) {
  return string.substring(thing.length)
}

module.exports = function listAppRefs (user, name, callback) {
  async.waterfall([
    toAppDir.bind(null, name),
    function withAppDir (appDir, next) {
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

        next(error, refs)
      })
    }
  ], callback)
}
