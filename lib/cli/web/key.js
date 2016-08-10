'use strict'

const pkg = require('../../../package.json')
const pem = require('pem')
const prompt = require('prompt')
const async = require('async')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const logger = require('winston')

function createP12File (user, password) {
  const keyFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.key`)
  const certFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.pub`)
  const caFile = path.join(config.CONFIG_DIR, 'ca.crt')

  logger.debug(`Looking for key at ${keyFile}`)
  logger.debug(`Looking for cert at ${certFile}`)
  logger.debug(`Looking for ca at ${caFile}`)

  async.parallel({
    key: fs.readFile.bind(fs, keyFile, 'utf8'),
    cert: fs.readFile.bind(fs, certFile, 'utf8'),
    ca: fs.readFile.bind(fs, caFile, 'utf8')
  }, (error, results) => {
    if (error && error.code === 'ENOENT') {
      logger.error(`No user certificate was found, please run 'sudo guv useradd ${user.name}'`)
      process.exit(1)
    }

    logger.debug('Creating pkcs12 file')

    pem.createPkcs12(results.key, results.cert, password, {
      certFiles: [results.ca]
    }, (error, result) => {
      if (error) {
        throw error
      }

      const writeTo = path.join(process.cwd(), `${user.name}.p12`)

      logger.debug('Writing pkcs12 file')

      fs.writeFile(writeTo, result.pkcs12, function (error) {
        if (error) {
          throw error
        }

        console.info(`Created ${writeTo}`)
      })
    })
  })
}

module.exports = (user, api, yargs) => {
  const argv = yargs
    .usage('Usage: $0 webkey [options]')
    .demand(3, 'Please specify a command')
    .example('$0 webkey', `Outputs ${user.name}.p12 into the current directory`)

    .describe('password', 'Password for the .p12 file')
    .alias('p', 'password')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  if (argv.password) {
    return createP12File(user, argv.password)
  }

  prompt.start()
  prompt.get([{
    name: 'password',
    hidden: true,
    conform: function (value) {
      return value.length > 3
    }
  }], (error, result) => {
    if (error) {
      throw error
    }

    createP12File(user, result.password)
  })

  api.disconnect()
}
