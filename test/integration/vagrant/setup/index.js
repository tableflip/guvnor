var async = require('async')
var findPort = require('./find-port')
var startVagrant = require('./start-vagrant')
var stopVagrant = require('./stop-vagrant')
var rootCredentials = require('./root-credentials')
var loadApi = require('../../../../lib/local/api')
var startDaemon = require('./start-daemon')
var noop = function () {

}

var logger = require('winston')
logger.level = 'debug'
logger.cli()

function vagrant (callback) {
  async.auto({
    'startVagrant': startVagrant,
    'startDaemon': ['startVagrant', function (next, results) {
      startDaemon(next)
    }],
    'serverPort': ['startDaemon', findPort],
    'serverAddress': ['serverPort', function (next, results) {
      next(null, 'https://localhost:' + results.serverPort)
    }],
    'rootCredentials': ['startDaemon', function (next, results) {
      // keep trying until the daemon has started..
      async.retry({
        times: 5,
        interval: 1000
      }, rootCredentials.bind(null, results.startContainer), next)
    }],
    'rootApi': ['serverAddress', 'rootCredentials', function (next, results) {
      process.env.GUVNOR_URL = results.serverAddress
      loadApi(results.rootCredentials, next)
    }],
    'userCredentials': ['rootApi', function (next, results) {
      results.rootApi.user.add('vagrant', next)
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
        async.series([
          async.asyncify(results.userApi ? results.rootApi.disconnect.bind(results.rootApi) : noop),
          async.asyncify(results.userApi ? results.userApi.disconnect.bind(results.userApi) : noop),
          async.asyncify(results.startDaemon ? results.startDaemon.kill.bind(results.startDaemon) : noop),
          stopVagrant
        ], done)
      }
    })
  })
}

module.exports = function initVagrant (callback) {
  callback(null, {
    beforeEach: vagrant,
    after: function (){}
  })
}
