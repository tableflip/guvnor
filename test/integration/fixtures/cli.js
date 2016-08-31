'use strict'

const logger = require('winston')
const daemon = require('./daemon')
const cli = require('../../../lib/cli')
const EventEmitter = require('events').EventEmitter

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

      console.info('---> cli running', args)
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
*/
      const process = new EventEmitter()
      process.stdin = new EventEmitter()
      process.stdin.destroy = () => {}
      process.stdout = {
        write: (line) => {
          console.info('---> stdout saw', line)
        }
      }
      process.stderr = {
        write: (line) => {
          console.info('---> stderr saw', line)
        }
      }
      process.argv = args
      process.exit = (code) => {}

      cli(process)

      process.stdin.read = () => args
      process.stdin.emit('readable')
      process.stdin.emit('end')
    })
  }
})
