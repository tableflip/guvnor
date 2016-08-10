'use strict'

const async = require('async')
const path = require('path')
const fs = require('fs')
const ini = require('ini')
const coercer = require('coercer')
const extend = require('extend')
const Joi = require('joi')
const os = require('os')
const config = require('../../config')

const schema = Joi.object({
  env: Joi.object(),
  execArgv: Joi.object(),
  cwd: Joi.string(),
  group: Joi.string(),
  instances: Joi.number().min(1).max(os.cpus().length),
  chroot: Joi.boolean()
}).required()

function findOptsFile (cwd, callback) {
  async.detect([
    path.join(cwd, `${config.DAEMON_NAME}.rc`),
    path.join(cwd, `.${config.DAEMON_NAME}.rc`),
    path.join(cwd, `${config.DAEMON_NAME}rc`),
    path.join(cwd, `.${config.DAEMON_NAME}rc`),
    path.join(cwd, `${config.DAEMON_NAME}.ini`),
    path.join(cwd, `.${config.DAEMON_NAME}.ini`)
  ], fs.exists, function (optsFile) {
    callback(null, optsFile)
  })
}

module.exports = function launchdLoadOptions (context, options, callback) {
  async.waterfall([
    findOptsFile.bind(null, options.cwd),
    function readFile (file, next) {
      if (!file) {
        return next(true)
      }

      fs.readFile(file, next)
    },
    function (str, next) {
      next(null, ini.safe(str))
    },
    function coerce (obj, next) {
      next(null, coercer(obj))
    },
    function validate (obj, next) {
      Joi.validate(obj, schema, next)
    },
    function extendObject (obj, next) {
      next(null, extend(true, obj, options))
    }
  ], function (error, results) {
    if (error) {
      results = options
    }

    callback(null, context, results)
  })
}
