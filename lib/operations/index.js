'use strict'

const os = require('os')
const logger = require('winston')
const Joi = require('joi')
const schema = require('./schema')
const stringify = require('json-stringify-safe')

module.exports = {}

function arrayify (values, length) {
  const input = []

  for (let i = 0; i < length; i++) {
    input.push(values[i])
  }

  return input
}

const platform = os.platform()
let processManager
let system

if (platform === 'darwin') {
  processManager = 'launchd'
  system = 'darwin'
} else if (platform === 'linux') {
  processManager = 'systemd'
  system = 'posix'
}

logger.debug(`Returning operations for ${platform}/${system}/${processManager}`)

if (!processManager || !system) {
  throw new Error(`Unsupported platform ${platform}`)
}

const api = {
  // process managaer specific
  createProcess: require(`./${processManager}/create-process`),
  findProcessFingerprint: require(`./${processManager}/find-process-fingerprint`),
  findProcess: require(`./${processManager}/find-process`),
  listProcesses: require(`./${processManager}/list-processes`),
  listProcessDetails: require(`./${processManager}/list-process-details`),
  removeProcessFiles: require(`./${processManager}/remove-process-files`),
  startProcess: require(`./${processManager}/start-process`),
  stopProcess: require(`./${processManager}/stop-process`),
  fetchProcessLogs: require(`./${processManager}/fetch-process-logs`),
  watchProcessLogs: require(`./${processManager}/watch-process-logs`),

  // system
  findGroupDetails: require(`./${system}/find-group-details`),
  findUserDetails: require(`./${system}/find-user-details`),
  findUserFingerprint: require(`./${system}/find-user-fingerprint`),
  listUsers: require(`./${system}/list-users`),
  getOs: require(`./${system}/get-os`),

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

Object.keys(api).forEach((key) => {
  module.exports[key] = function validateInput () {
    // try to use the request logger if it's available
    const log = arguments[0] && arguments[0].log ? arguments[0].log : console.error.bind(console)
    const numInputArgs = arguments.length

    Joi.validate(arguments, schema[key].args, function (error, values) {
      const callback = values[numInputArgs - 1]

      if (error) {
        log(`Failed to validate ${key} input: ${stringify(values, null, 2)}`)
        log(error)

        if (callback) {
          return callback(error)
        } else {
          throw error
        }
      }

      // replace callback with function to validate return value
      values[numInputArgs - 1] = function validateOutput () {
        const numOutputArgs = arguments.length

        Joi.validate(arguments, schema[key].output, function (error, values) {
          if (error) {
            log(`Failed to validate ${key} output: ${stringify(values, null, 2)}`)
            log(error)

            return callback(error)
          }

          const output = arrayify(values, numOutputArgs)

          callback.apply(null, output)
        })
      }

      const input = arrayify(values, numInputArgs)

      api[key].apply(null, input)
    })
  }
})
