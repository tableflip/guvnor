'use strict'

const child_process = require('child_process')
const logger = require('winston')

const run = (cmd, args, options) => {
  options = options || {}

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''

    logger.debug('$', cmd, args.join(' '))

    const proc = child_process.spawn(cmd, args, options)
    proc.stdout.on('data', data => {
      const str = data.toString('utf8')

      if (str.trim()) {
        stdout += str
      }

      if (!options.hideOutput) {
        `${str.trim()}`.split('\n').forEach(line => logger.info(line))
      }
    })
    proc.stderr.on('data', data => {
      const str = data.toString('utf8')
      stderr += str

      if (str.trim()) {
        stderr += str
      }

      if (!options.hideOutput && !process.env.QUIET) {
        `${str.trim()}`.split('\n').forEach(line => logger.error(line))
      }
    })

    if (options.ignoreExit) {
      proc.unref()
      return resolve()
    }

    proc.on('close', code => {
      if (code === 0) {
        return resolve(stdout.trim())
      }

      if (options.ignoreExit) {
        return
      }

      const error = new Error(`Child process ${cmd} ${args.join(' ')} exited with code ${code}`)
      error.code = code
      error.stdout = stdout.trim()
      error.stderr = stderr.trim()

      reject(error)
    })
  })
}

module.exports = run
