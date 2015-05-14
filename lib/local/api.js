var https = require('https')
var Wreck = require('wreck')
var logger = require('winston')
var async = require('async')
var processNameFromScript = require('../common/process-name-from-script')
var socketIOClient = require('socket.io-client')
var through2 = require('through2')
var OutputBuffer = require('output-buffer')

function convertError (codes, error, response) {
  if (!error && (response.statusCode < 200 || response.statusCode > 299)) {
    error = new Error(response.statusCode + ' ' + response.statusMessage)
  }

  if (response) {
    if (response.statusCode === 403) {
      error = new Error('Please run this command as root')
    }

    if (codes[response.statusCode]) {
      error = new Error(codes[response.statusCode])
    }
  }

  return error
}

function handleResponse (codes, callback, error, response) {
  if (error) {
    error = convertError(codes, error, response)

    return callback(error)
  }

  error = convertError(codes, error, response)

  Wreck.read(response, null, function (bodyError, body) {
    if (!bodyError) {
      if (response.headers['content-type'] && body) {
        if (response.headers['content-type'].indexOf('text/plain') !== -1) {
          body = body.toString()
        } else if (response.headers['content-type'].indexOf('application/json') !== -1) {
          try {
            body = JSON.parse(body)
          } catch (e) {
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

    callback(error, body)
  })
}

var endStreamMarker = '-----guvnor-stream-end-----'

function handleStreamingResponse (codes, output, callback, error, response) {
  if (error) {
    error = convertError(codes, error, response)

    return callback(error)
  }

  error = convertError(codes, error, response)

  var foundEnd
  var returnArgs = ''

  var buffer = new OutputBuffer(function (line) {
    if (line === endStreamMarker) {
      foundEnd = true
    } else if (foundEnd) {
      returnArgs += line
    } else {
      output(line)
    }
  })

  response.pipe(through2(function (chunk, enc, next) {
    buffer.append(chunk.toString())

    next()
  }, function () {
    buffer.flush()

    var args = [error]

    if (returnArgs.length) {
      args = JSON.parse(returnArgs)

      if (args[0]) {
        var err = args[0]

        args[0] = new Error(err.message)
        args[0].code = err.statusCode
        args[0].error = err.error
      }
    }

    callback.apply(null, args)
  }))
}

module.exports = function loadApi (keyBundle, callback) {
  var guvnor = process.env.GUVNOR_URL || 'https://localhost:8001'

  // configure wreck
  var wreck = Wreck.defaults({
    baseUrl: guvnor
  })

  wreck.on('response', function (error, request, response, start, uri) {
    if (error) {
      logger.warn('%s %s error - %s', request.method, uri.href, error.message)
    } else {
      logger.debug('%s %s %d', request.method, uri.href, response.statusCode)
    }
  })

  // configure Wreck agents
  wreck.agents.https = new https.Agent({
    // maxSockets: config.maxSockets,
    // timeout: config.timeout,
    cert: keyBundle.cert,
    key: keyBundle.key,
    ca: keyBundle.ca
  })

  var socket = guvnor.replace('https', 'wss')
  logger.debug('Connecting to websocket', socket)
  var api = socketIOClient(socket, {
    cert: keyBundle.cert,
    key: keyBundle.key,
    ca: keyBundle.ca,
    forceNew: true
  })

  // api namespaces
  api.app = {

  }
  api.user = {

  }
  api.process = {

  }

  api.app.install = function (url, name, output, callback) {
    wreck.request('POST', '/apps', {
      payload: JSON.stringify({
        url: url,
        name: name
      })
    }, handleStreamingResponse.bind(null, {}, output, callback))
  }

  api.app.list = function (callback) {
    wreck.request('GET', '/apps', {}, handleResponse.bind(null, {}, callback))
  }

  api.app.remove = function (name, callback) {
    wreck.request('DELETE', '/apps/' + name, {}, handleResponse.bind(null, {
      404: 'No app found for ' + name
    }, callback))
  }

  api.app.ref = function (name, callback) {
    wreck.request('GET', '/apps/' + name + '/ref', {}, handleResponse.bind(null, {
      404: 'No app found for ' + name
    }, callback))
  }

  api.app.refs = function (name, callback) {
    wreck.request('GET', '/apps/' + name + '/refs', {}, handleResponse.bind(null, {
      404: 'No app found for ' + name
    }, callback))
  }

  api.user.add = function (name, callback) {
    wreck.request('POST', '/certificates/user', {
      payload: JSON.stringify({
        user: name
      })
    }, handleResponse.bind(null, {
      '409': 'A certificate already exists for that user, please remove it with `guv user rm ' + name + '` first',
      '412': 'That user does not exist'
    }, callback))
  }

  api.user.remove = function (name, callback) {
    wreck.request('DELETE', '/certificates/user', {
      payload: JSON.stringify({
        user: name
      })
    }, handleResponse.bind(null, {}, callback))
  }

  api.process.list = function (callback) {
    wreck.request('GET', '/processes', {}, handleResponse.bind(null, {}, callback))
  }

  api.process.start = function (script, options, callback) {
    options.script = script

    var name = processNameFromScript(options.name || options.script)

    var tasks = [
      function startProcessRequest (next) {
        logger.debug('Starting process %s', name)
        wreck.request('PUT', '/processes/' + name, {
          payload: JSON.stringify({
            status: 'start'
          })
        }, handleResponse.bind(null, {
          '409': name + ' is already running'
        }, next))
      }
    ]

    wreck.request('GET', '/processes/' + name, {}, function (error, response) {
      if (error) {
        return callback(error)
      }

      if (response.statusCode === 404) {
        logger.debug('Process %s did not exist, will create it', name)

        // create the process before starting it
        tasks.unshift(
          function createProcessRequest (next) {
            logger.debug('Creating process %s', name)
            wreck.request('POST', '/processes', {
              payload: JSON.stringify(options)
            },
            handleResponse.bind(null, {}, next))
          }
        )
      }

      async.series(tasks, function (error, results) {
        callback(error, results ? results[results.length - 1] : null)
      })
    })
  }

  api.process.stop = function (script, callback) {
    wreck.request('PUT', '/processes/' + script, {
      payload: JSON.stringify({
        status: 'stop'
      })
    }, handleResponse.bind(null, {
      '409': script + ' is not running'
    }, callback))
  }

  api.process.remove = function (script, callback) {
    wreck.request('DELETE', '/processes/' + script, {}, handleResponse.bind(null, {
      404: 'No process found for ' + script
    }, callback))
  }

  api.process.gc = function (script, callback) {
    wreck.request('POST', '/processes/' + script + '/gc', {}, handleResponse.bind(null, {
      404: 'No process found for ' + script
    }, callback))
  }

  api.process.takeHeapSnapshot = function (script, callback) {
    wreck.request('POST', '/processes/' + script + '/heapsnapshot', {}, handleResponse.bind(null, {
      404: 'No process found for ' + script
    }, callback))
  }

  api.process.removeHeapSnapshot = function (script, id, callback) {
    wreck.request('DELETE', '/processes/' + script + '/heapsnapshot/' + id, {}, handleResponse.bind(null, {
      404: 'No process found for ' + script
    }, callback))
  }

  api.process.getHeapSnapshot = function (script, id, callback) {
    wreck.request('GET', '/processes/' + script + '/heapsnapshot/' + id, {}, handleResponse.bind(null, {
      404: 'No process found for ' + script
    }, callback))
  }

  api.on('connect', function () {
    logger.debug('Connected to websocket')
    if (callback) {
      callback(null, api)
      callback = null
    }
  })
  api.on('error', function (error) {
    logger.error('Error connecting to websocket', error)
    if (callback) {
      callback(error)
      callback = null
    }
  })
  api.on('disconnect', function () {
    logger.debug('Websocket disconnect')
  })
  api.on('reconnect', function (attempt) {
    logger.debug('Websocket reconnect #%d', attempt)
  })
  api.on('reconnect_attempt', function () {
    logger.debug('Websocket reconnect attempt')
  })
  api.on('reconnecting', function (attempt) {
    logger.debug('Websocket reconnecting #%d', attempt)
  })
  api.on('reconnect_error', function (error) {
    if (error.description === 503) {
      logger.error('Could not connect to guvnor - your certificate may be invalid, please run `sudo guv useradd %YOUR_USER%`')
      process.exit(1)
    }

    logger.warn('Websocket reconnect error', error.type, error.description)
  })
  api.on('reconnect_failed', function () {
    logger.debug('Websocket reconnect failed')
  })
}
