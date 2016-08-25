'use strict'

const Wreck = require('wreck')
const logger = require('winston')
const https = require('https')
const END_STREAM = require('./end-stream-marker')
const OutputBuffer = require('output-buffer')
const through2 = require('through2')
const qs = require('qs')
const config = require('./config')

const convertError = (method, codes, error, response) => {
  if (!error && (response.statusCode < 200 || response.statusCode > 299)) {
    error = new Error(`${response.statusCode} ${response.statusMessage}`)
  }

  if (response) {
    if (response.statusCode === 401) {
      error = new Error('Invalid credentials or no credentials supplied')
      error.code = 'EINVALIDCERT'
    }

    if (response.statusCode === 403) {
      error = new Error('Please run this command as root')
    }

    if (codes[response.statusCode]) {
      error = new Error(codes[response.statusCode])
    }

    if (error && response.statusCode === 404 && method === 'GET') {
      error = null
    }

    if (error) {
      error.message = error.message + ' Request ID: ' + response.headers['guvnor-request-id']
    }
  }

  if (error && response && response.statusCode) {
    error.statusCode = response.statusCode
  }

  return error
}

const handleResponse = (method, codes, callback, error, response) => {
  if (error) {
    error = convertError(method, codes, error, response)

    return callback(error)
  }

  error = convertError(method, codes, error, response)

  Wreck.read(response, null, (bodyError, body) => {
    if (body) {
      logger.debug(body.toString('utf8'))
    }

    if (!bodyError) {
      if (response.headers['content-type'] && body) {
        if (response.headers['content-type'].indexOf('text/plain') !== -1) {
          body = body.toString('utf8')
        } else if (response.headers['content-type'].indexOf('application/json') !== -1) {
          try {
            body = JSON.parse(body.toString('utf8'))
          } catch (e) {
            logger.debug('Could not parse JSON response', body)
            bodyError = e
          }
        }
      }
    }

    if (!error && bodyError) {
      error = bodyError
    }

    if (error && body && body.message) {
      logger.debug(body.message)
    }

    if (response.statusCode === 404 && method === 'GET') {
      body = undefined
    }

    callback(error, body)
  })
}

const handleStreamingResponse = (method, codes, output, callback, error, response) => {
  if (error) {
    error = convertError(method, codes, error, response)

    return callback(error)
  }

  error = convertError(method, codes, error, response)

  let foundEnd
  let returnArgs = ''

  const buffer = new OutputBuffer((line) => {
    if (line === END_STREAM) {
      foundEnd = true
    } else if (foundEnd) {
      returnArgs += line
    } else {
      output(line)
    }
  })

  response.pipe(through2((chunk, enc, next) => {
    buffer.append(chunk.toString())

    next()
  }, (cb) => {
    buffer.flush()

    let args = [error]

    if (returnArgs.length) {
      args = JSON.parse(returnArgs)

      const serverError = args[0]

      if (serverError) {
        const err = new Error()

        if (serverError.isBoom) {
          err.message = serverError.output.payload.message
          err.error = serverError.output.payload.error
          err.statusCode = serverError.output.statusCode
        }

        if (serverError.syscall) {
          err.message += `, syscall: ${serverError.syscall}`
        }

        if (serverError.code === 'ENOENT') {
          err.message += `, path: ${serverError.path}`
        }

        if (serverError.code) {
          err.message += `, code: ${serverError.code}`
        }

        args[0] = err
      }
    }

    callback.apply(null, args)
    cb()
  }))
}

const handleStreamingDataResponse = (method, codes, data, callback, error, response) => {
  if (error) {
    error = convertError(method, codes, error, response)

    return callback(error)
  }

  error = convertError(method, codes, error, response)

  if (error) {
    error = convertError(method, codes, error, response)

    return callback(error)
  }

  response.pipe(through2(data, (cb) => {
    callback()
    cb()
  }))}

module.exports = (keyBundle) => {
  const url = config.DAEMON_URL

  // configure wreck
  const wreck = Wreck.defaults({
    baseUrl: url,
    agent: new https.Agent({
      // maxSockets: config.maxSockets,
      // timeout: config.timeout,
      cert: keyBundle.cert,
      key: keyBundle.key,
      ca: keyBundle.ca
    })
  })

  wreck.on('response', (error, request, response, start, uri) => {
    if (error) {
      logger.debug(`${request.method} ${uri.href} error - ${error.message}`)
    } else {
      logger.debug(`${request.method} ${uri.href} ${response.statusCode}`)
      logger.debug(response.headers)
    }
  })

  return {
    url: url,
    request: (opts, callback) => {
      opts = opts || {}
      opts.payload = opts.payload ? {
        payload: JSON.stringify(opts.payload)
      } : {}
      opts.statusMappings = opts.statusMappings || {}

      if (opts.query) {
        opts.path += `?${qs.stringify(opts.query)}`
      }

      let responseHandler

      if (opts.output) {
        responseHandler = handleStreamingResponse.bind(null, opts.method, opts.statusMappings, opts.output, callback)
      } else if (opts.data) {
        responseHandler = handleStreamingDataResponse.bind(null, opts.method, opts.statusMappings, opts.data, callback)
      } else {
        responseHandler = handleResponse.bind(null, opts.method, opts.statusMappings, callback)
      }

      wreck.request(opts.method, opts.path, opts.payload, responseHandler)
    }
  }
}
