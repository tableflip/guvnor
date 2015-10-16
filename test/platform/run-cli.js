var cli = require('../../lib/cli')
var logger = require('winston')

module.exports = function runCli (credentials, args, lines, done, callback) {
  process.env.GUVNOR_USER_CERT = credentials.cert
  process.env.GUVNOR_USER_KEY = credentials.key
  process.env.GUVNOR_CA = credentials.ca

  args.unshift('/path/to/guvnor')
  args.unshift('/path/to/node')

  var output = ''
  var seen = 0
  var outWrite = process.stdout.write

  var collectOutput = function (line) {
    logger.error(line.trim())
    output += line
    seen++

    if (seen === lines) {
      process.stdout.write = outWrite

      try {
        if (args.indexOf('--json') !== -1) {
          output = JSON.parse(output)
        }

        callback(output)
      } catch (e) {
        done(e)
      }
    }
  }

  process.stdout.write = collectOutput

  cli(args)
}
