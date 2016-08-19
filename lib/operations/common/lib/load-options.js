'use strict'

const path = require('path')
const fs = require('fs-promise')
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

const findOptsFile = (cwd) => {
  const paths = [
    path.join(cwd, `${config.DAEMON_NAME}.rc`),
    path.join(cwd, `.${config.DAEMON_NAME}.rc`),
    path.join(cwd, `${config.DAEMON_NAME}rc`),
    path.join(cwd, `.${config.DAEMON_NAME}rc`),
    path.join(cwd, `${config.DAEMON_NAME}.ini`),
    path.join(cwd, `.${config.DAEMON_NAME}.ini`)
  ]

  return Promise.all(paths.map((path) => fs.exists(path)))
  .then(results => results.indexOf(true))
  .then(index => paths[index])
}

const loadOptions = (context, options) => {
  return findOptsFile(options.cwd)
  .then(file => {
    if (!file) {
      return ''
    }

    return fs.readFile(file, 'utf8')
  })
  .then(contents => ini.safe(contents))
  .then(props => coercer(props))
  .then(obj => {
    return new Promise((resolve, reject) => {
      Joi.validate(obj, schema, (error, results) => {
        if (error) {
          reject(error)
        }

        resolve(results)
      })
    })
  })
  .then(obj => extend(true, obj, options))
}

module.exports = loadOptions
