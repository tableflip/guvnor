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
var prefix

if (platform === 'darwin') {
  prefix = 'launchd'
} else if (platform === 'linux') {
  prefix = 'systemd'
}

logger.debug('Returning process operations for %s/%s', platform, prefix)

if (!prefix) {
  throw new Error('Unsupported platform ' + platform)
}

var api = {
  // platform specific
  createProcess: require('./' + prefix + '/create-process'),
  findProcess: require('./' + prefix + '/find-process'),
  findProcessFingerprint: require('./' + prefix + '/find-process-fingerprint'),
  listProcesses: require('./' + prefix + '/list-processes'),
  removeProcessFiles: require('./' + prefix + '/remove-process-files'),
  startProcess: require('./' + prefix + '/start-process'),
  stopProcess: require('./' + prefix + '/stop-process'),

  // common to all platforms
  listProcessStatuses: require('./common/list-process-statuses'),
  removeProcess: require('./common/remove-process'),
  forceGc: require('./common/force-gc'),
  fetchHeapSnapshot: require('./common/fetch-heap-snapshot'),
  listHeapSnapshots: require('./common/list-heap-snapshots'),
  removeHeapSnapshot: require('./common/remove-heap-snapshot'),
  takeHeapSnapshot: require('./common/take-heap-snapshot'),
  installApp: require('./common/install-app'),
  removeApp: require('./common/remove-app'),
  listApps: require('./common/list-apps'),
  listAppRefs: require('./common/list-app-refs'),
  findAppRef: require('./common/find-app-ref')
}

Object.keys(api).forEach(function (key) {
  module.exports[key] = function validateInput () {
    logger.debug('Validating %s input', key)
    logger.debug('%j', arguments, {})

    var inputArgs = arguments.length

    Joi.validate(arguments, schema[key].args, function (error, values) {
      var callback = values[inputArgs - 1]

      if (error) {
        if (callback) {
          return callback(error)
        }

        throw error
      }

      // replace callback with function to validate return value
      values[inputArgs - 1] = function validateOutput () {
        var outputArgs = arguments.length

        logger.debug('Validating %s output', key)
        logger.debug('%j', arguments, {})

        Joi.validate(arguments, schema[key].output, function (error, values) {
          if (error) {
            return callback(error)
          }

          var output = arrayify(values, outputArgs)

          callback.apply(null, output)
        })
      }

      var input = arrayify(values, inputArgs)

      logger.debug('Invoking %s %s', key, typeof api[key])
      api[key].apply(null, input)
    })
  }
})
