var async = require('async')
var Joi = require('joi')
var chooseDebugPort = require('../common/choose-debug-port')
var createPlist = require('./create-plist')
var loadJobDefinition = require('./load-job-definition')
var stopDaemon = require('../../stop-daemon')

var schema = Joi.object({
  debug: Joi.object({
    daemon: Joi.alternatives().try(Joi.number(), Joi.boolean()),
    cluster: Joi.boolean()
  }),
  daemonise: Joi.boolean(),
  daemonize: Joi.boolean(),
  daemon: Joi.object({
    user: Joi.string(),
    group: Joi.string(),
    logdir: Joi.string(),
    rundir: Joi.string(),
    confdir: Joi.string(),
    appdir: Joi.string(),
    timeout: Joi.number(),
    autoresume: Joi.boolean(),
    rpctimeout: Joi.number(),
    minnodeversion: Joi.string(),
    restarttimeout: Joi.number()
  }),
  remote: Joi.object({
    enabled: Joi.boolean(),
    port: Joi.number(),
    host: Joi.string(),
    advertise: Joi.boolean(),
    key: Joi.string(),
    passphrase: Joi.string(),
    certificate: Joi.string(),
    inspector: Joi.object({
      enabled: Joi.boolean(),
      port: Joi.number(),
      host: Joi.string()
    })
  }),
  ports: Joi.object({
    start: Joi.number(),
    end: Joi.number()
  })
}).required()

module.exports = function startDaemon (config, callback) {
  async.waterfall([
    function validate (next) {
      delete config._
      delete config.v

      Joi.validate(config, schema, next)
    },
    chooseDebugPort,
    createPlist,
    stopDaemon,
    loadJobDefinition
  ], callback)
}
