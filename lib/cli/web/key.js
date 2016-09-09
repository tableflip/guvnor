'use strict'

const pkg = require('../../../package.json')
const pem = require('pem-promise')
const prompt = require('prompt')
const fs = require('fs-promise')
const path = require('path')
const config = require('../config')
const logger = require('winston')
const operations = require('../../operations')
const context = require('../../daemon/lib/global-context')

const getPassword = argv => {
  if (argv.password) {
    return Promise.resolve(argv.password)
  }

  return new Promise((resolve, reject) => {
    prompt.start()
    prompt.get([{
      name: 'password',
      hidden: true,
      conform: value => value.length > 3
    }], (error, result) => {
      if (error) {
        return reject(error)
      }

      resolve(result.password)
    })
  })
}

const createP12File = (user, password) => {
  const keyFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.key`)
  const certFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.pub`)
  const caFile = path.join(config.CONFIG_DIR, 'ca.crt')
  const writeTo = path.join(process.cwd(), `${user.name}.p12`)

  logger.debug(`Looking for key at ${keyFile}`)
  logger.debug(`Looking for cert at ${certFile}`)
  logger.debug(`Looking for ca at ${caFile}`)

  return Promise.all([
    fs.readFile(keyFile, 'utf8'),
    fs.readFile(certFile, 'utf8'),
    fs.readFile(caFile, 'utf8')
  ])
  .then(results => pem.createPkcs12(results[0], results[1], password, {
    certFiles: [results[2]]
  }))
  .then(result => fs.writeFile(writeTo, result.pkcs12))
  .then(() => `Created ${writeTo}`)
}

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 webkey [options]')
    .demand(3, 'Please specify a command')
    .example('$0 webkey', 'Outputs bob.p12 into the current directory')

    .describe('password', 'Password for the .p12 file')
    .alias('p', 'password')

    .describe('user', 'Which user to generate the .p12 file for')
    .alias('u', 'user')
    .default('u', process.getuid())

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  return context()
  .then(context => {
    context.log = (tags, message) => logger.debug(message)

    return operations.findUserDetails(context, argv.user)
  })
  .then(user => {
    return getPassword(argv)
    .then(password => createP12File(user, password))
  })
}
