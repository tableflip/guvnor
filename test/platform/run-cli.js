var cli = require('../../lib/cli')
var logger = require('winston')

module.exports = function runCli (args, lines, done, callback) {
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
        callback(output)
      } catch (e) {
        done(e)
      }
    }
  }

  process.stdout.write = collectOutput

  cli(args)
}
