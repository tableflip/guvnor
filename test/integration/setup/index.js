var async = require('async')
var findServerHost = require('./find-server-host')
var freeport = require('freeport')
var createImage = require('./create-image')
var startContainer = require('./start-container')
var stopContainer = require('./stop-container')
var removeContainer = require('./remove-container')
var rootApi = require('./root-api')
var loadApi = require('../../../lib/local/api')
var attachLogger = require('./attach-logger')

var logger = require('winston')
logger.level = 'debug'
logger.cli()

function startDocker (tag, callback) {
  async.auto({
    'serverPort': freeport,
    'serverHost': findServerHost,
    'serverAddress': ['serverPort', 'serverHost', function (next, results) {
      next(null, 'https://' + results.serverHost + ':' + results.serverPort)
    }],
    'startContainer': ['serverHost', 'serverPort', function (next, results) {
      startContainer(tag, results.serverHost, results.serverPort, next)
    }],
    'attachLogger': ['startContainer', function (next, results) {
      attachLogger(results.startContainer, next)
    }],
    'rootCredentials': ['startContainer', function (next, results) {
      // keep trying until the container has started..
      async.retry({
        times: 5,
        interval: 1000
      }, rootApi.bind(null, results.startContainer), next)
    }],
    'rootApi': ['serverAddress', 'rootCredentials', function (next, results) {
      process.env.GUVNOR_URL = results.serverAddress
      loadApi(results.rootCredentials, next)
    }],
    'userCredentials': ['rootApi', function (next, results) {
      results.rootApi.user.add('guvnor', next)
    }],
    'userApi': ['userCredentials', function (next, results) {
      loadApi(results.userCredentials, next)
    }]
  }, function (error, results) {
    callback(error, {
      rootApi: results.rootApi,
      rootCredentials: results.rootCredentials,
      userApi: results.userApi,
      userCredentials: results.userCredentials,
      afterEach: function (done) {
        results.attachLogger.kill()

        async.series([
          async.asyncify(results.rootApi.disconnect.bind(results.rootApi)),
          async.asyncify(results.userApi.disconnect.bind(results.userApi)),
          stopContainer.bind(null, results.startContainer),
          removeContainer.bind(null, results.startContainer)
        ], done)
      }
    })
  })
}

module.exports = function initDocker (callback) {
  var tag = 'guvnor'

  createImage(tag, function (error) {
    if (error) {
      return callback(error)
    }

    callback(error, {
      beforeEach: startDocker.bind(null, tag),
      after: function (){}
    })
  })
}
