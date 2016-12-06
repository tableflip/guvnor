'use strict'

const pkg = require('../../../package.json')
const pem = require('pem-promise')
const fs = require('fs-promise')
const path = require('path')
const config = require('../config')
const logger = require('winston')
const operations = require('../../operations')
const context = require('../../common/winston-context')
const os = require('os')

const createP12File = (user, password, output) => {
  const keyFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.key`)
  const certFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.pub`)
  const caFile = path.join(config.CONFIG_DIR, 'ca.crt')
  const writeTo = path.join(output, `${user.name}.p12`)

  logger.debug(`Looking for key at ${keyFile}`)
  logger.debug(`Looking for cert at ${certFile}`)
  logger.debug(`Looking for ca at ${caFile}`)

  return Promise.all([
    fs.readFile(keyFile, 'utf8'),
    fs.readFile(certFile, 'utf8'),
    fs.readFile(caFile, 'utf8')
  ])
  .then(([key, cert, ca]) => pem.createPkcs12(key, cert, password, {
    certFiles: [ca]
  }))
  .then(result => fs.writeFile(writeTo, result.pkcs12))
  .then(() => `Created key store at ${writeTo}`)
}

const createCAFile = (ca, output) => {
  const writeTo = path.join(output, `${config.DAEMON_NAME}.crt`)

  return fs.writeFile(writeTo, ca)
  .then(() => `Created CA cert at ${writeTo}`)
}

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 key password [options]')
    .demand(4, 'Please specify a password for the key store')
    .example('$0 key', `Outputs ${os.userInfo().username}.p12 into the current directory`)

    .describe('password', 'Password for the .p12 file')
    .alias('p', 'password')

    .describe('user', 'Which user to generate the .p12 file for')
    .alias('u', 'user')
    .default('u', os.userInfo().username)

    .describe('output', 'Where to place the generated files')
    .alias('o', 'output')
    .default('o', process.cwd())

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  return context()
  .then(context => {
    if (argv.user === context.user.name) {
      return context.user
    }

    return operations.findUserDetails(context, argv.user)
  })
  .then(user => Promise.all([
    createP12File(user, argv._[3], argv.output),
    createCAFile(certs.ca, argv.output)
  ]))
  .then(([p12, ca]) => [
    p12,
    ca,
    '',
    'Please import the key store and CA certificate into your browser or keychain.',
    '',
    'See https://github.com/tableflip/guvnor/blob/master/docs/web.md for more information.'
  ].join('\n'))
}
