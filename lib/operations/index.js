var os = require('os')
var logger = require('winston')
var Joi = require('joi')
var schema = require('./schema')

module.exports = {}

function arrayify (values, length) {
  var input = []

  for (var i = 0; i < length; i++) {
    input.push(values[i])
  }

  return input
}

var platform = os.platform()
var processManager
var system

if (platform === 'darwin') {
  processManager = 'launchd'
  system = 'darwin'
} else if (platform === 'linux') {
  processManager = 'systemd'
  system = 'posix'
}

logger.debug('Returning operations for %s/%s/%', platform, system, processManager)

if (!processManager || !system) {
  throw new Error('Unsupported platform ' + platform)
}

var api = {
  // process managaer specific
  createProcess: require('./' + processManager + '/create-process'),
  findProcessFingerprint: require('./' + processManager + '/find-process-fingerprint'),
  findProcess: require('./' + processManager + '/find-process'),
  listProcesses: require('./' + processManager + '/list-processes'),
  listProcessDetails: require('./' + processManager + '/list-process-details'),
  removeProcessFiles: require('./' + processManager + '/remove-process-files'),
  startProcess: require('./' + processManager + '/start-process'),
  stopProcess: require('./' + processManager + '/stop-process'),
  fetchProcessLogs: require('./' + processManager + '/fetch-process-logs'),
  watchProcessLogs: require('./' + processManager + '/watch-process-logs'),

  // system
  findGroupDetails: require('./' + system + '/find-group-details'),
  findUserDetails: require('./' + system + '/find-user-details'),
  findUserFingerprint: require('./' + system + '/find-user-fingerprint'),
  listUsers: require('./' + system + '/list-users'),
  getOs: require('./' + system + '/get-os'),

  // common to all platforms
  findProcessDetails: require('./common/find-process-details'),
  getServerStatus: require('./common/get-server-status'),
  removeProcess: require('./common/remove-process'),
  forceGc: require('./common/force-gc'),
  fetchHeapSnapshot: require('./common/fetch-heap-snapshot'),
  listHeapSnapshots: require('./common/list-heap-snapshots'),
  removeHeapSnapshot: require('./common/remove-heap-snapshot'),
  takeHeapSnapshot: require('./common/take-heap-snapshot'),
  setNumWorkers: require('./common/set-num-workers'),
  installApp: require('./common/install-app'),
  removeApp: require('./common/remove-app'),
  listApps: require('./common/list-apps'),
  listAppRefs: require('./common/list-app-refs'),
  findAppRef: require('./common/find-app-ref'),
  updateApp: require('./common/update-app'),
  setAppRef: require('./common/set-app-ref')
}

Object.keys(api).forEach(function (key) {
  module.exports[key] = function validateInput () {
    var inputArgs = arguments.length

    Joi.validate(arguments, schema[key].args, function (error, values) {
      var callback = values[inputArgs - 1]

      if (error) {
        console.error('Failed to validate %s input', key)
        console.error('%j', values)

        if (callback) {
          return callback(error)
        }

        throw error
      }

      // replace callback with function to validate return value
      values[inputArgs - 1] = function validateOutput () {
        var outputArgs = arguments.length

        Joi.validate(arguments, schema[key].output, function (error, values) {
          if (error) {
            console.error('Failed to validate %s output', key, error)
            console.error('%j', values)

            return callback(error)
          }

          var output = arrayify(values, outputArgs)

          callback.apply(null, output)
        })
      }

      var input = arrayify(values, inputArgs)

      api[key].apply(null, input)
    })
  }
})
