var pkg = require('../../../package.json')
var pem = require('pem')
var prompt = require('prompt')
var async = require('async')
var fs = require('fs')
var path = require('path')
var config = require('../config')
var logger = require('winston')

function createP12File (user, password) {
  var keyFile = path.join(user.home, '.config', 'guvnor', user.name + '.key')
  var certFile = path.join(user.home, '.config', 'guvnor', user.name + '.pub')
  var caFile = path.join(config.CONFIG_DIR, 'ca.crt')

  logger.debug('Looking for key at %s', keyFile)
  logger.debug('Looking for cert at %s', certFile)
  logger.debug('Looking for ca at %s', caFile)

  async.parallel({
    key: fs.readFile.bind(fs, keyFile, 'utf8'),
    cert: fs.readFile.bind(fs, certFile, 'utf8'),
    ca: fs.readFile.bind(fs, caFile, 'utf8')
  }, function (error, results) {
    if (error && error.code === 'ENOENT') {
      logger.error('No user certificate was found, please run `sudo guv useradd ' + user.name + '`')
      process.exit(1)
    }

    logger.debug('Creating pkcs12 file')

    pem.createPkcs12(results.key, results.cert, password, {
      certFiles: [results.ca]
    }, function (error, result) {
      if (error) {
        throw error
      }

      var writeTo = path.join(process.cwd(), user.name + '.p12')

      logger.debug('Writing pkcs12 file')
      fs.writeFile(writeTo, result.pkcs12, function (error) {
        if (error) {
          throw error
        }

        console.info('Created', writeTo)
      })
    })
  })
}

module.exports = function webKey (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 webkey [options]')
    .demand(3, 'Please specify a command')
    .example('$0 webkey', 'Outputs ' + user.name + '.p12 into the current directory')

    .describe('password', 'Password for the .p12 file')
    .alias('p', 'password')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var userName = argv._[3]

  if (argv.password) {
    return createP12File(user, argv.password)
  }

  prompt.start()
  prompt.get([{
    name: 'password',
    hidden: true,
    conform: function (value) {
      return value.length > 3;
    }
  }], function (error, result) {
    if (error) {
      throw error
    }

    createP12File(user, result.password)
  })

  api.disconnect()
}
