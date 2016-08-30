'use strict'

const logger = require('winston')
const daemon = require('./daemon')
const cli = require('../../../lib/cli')

module.exports = daemon
.then(credentials => {
  process.env.GUVNOR_USER_CERT = credentials.cert
  process.env.GUVNOR_USER_KEY = credentials.key
  process.env.GUVNOR_CA = credentials.ca
})
.then(() => {
  return (args, lines) => {
    return new Promise((resolve, reject) => {
      args.unshift('/path/to/guvnor')
      args.unshift('/path/to/node')
/*
      let output = ''
      let seen = 0
      const outWrite = process.stdout.write

      process.stdout.write = (line) => {
        logger.info(line.trim())
        output += line
        seen++

        if (seen === lines) {
          process.stdout.write = outWrite

          try {
            if (args.indexOf('--json') !== -1) {
              output = JSON.parse(output)
            }

            resolve(output)
          } catch (error) {
            reject(error)
          }
        }
      }

      cli(args)
*/
    })
  }
})
