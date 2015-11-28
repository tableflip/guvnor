var Wreck = require('wreck')
var logger = require('winston')
var async = require('async')
var processNameFromScript = require('../common/process-name-from-script')
var socketIOClient = require('socket.io-client')
var through2 = require('through2')
var OutputBuffer = require('output-buffer')
var daemonRestConnection = require('../common/daemon-rest-connection')

module.exports = function loadApi (keyBundle, callback) {
  if (!keyBundle || !keyBundle.cert || !keyBundle.key || !keyBundle.ca) {
    return callback(new Error('No keybundle supplied'))
  }

  var wreck = daemonRestConnection({
    cert: keyBundle.cert,
    key: keyBundle.key,
    ca: keyBundle.ca
  })
  var socket = wreck.url.replace('https', 'wss')

  logger.debug('Connecting to REST server', wreck.url)
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
    wreck.request({
      method: 'POST',
      path: '/apps',
      payload: {
        url: url,
        name: name
      },
      output: output
    }, callback)
  }

  api.app.list = function (callback) {
    wreck.request({
      method: 'GET',
      path: '/apps'
    }, callback)
  }

  api.app.remove = function (name, callback) {
    wreck.request({
      method: 'DELETE',
      path: '/apps/' + name,
      statusMappings: {
        404: 'No app found for ' + name
      }
    }, callback)
  }

  api.app.ref = function (name, callback) {
    wreck.request({
      method: 'GET',
      path: '/apps/' + name + '/ref',
      statusMappings: {
        404: 'No app found for ' + name
      }
    }, callback)
  }

  api.app.refs = function (name, callback) {
    wreck.request({
      method: 'GET',
      path: '/apps/' + name + '/refs',
      statusMappings: {
        404: 'No app found for ' + name
      }
    }, callback)
  }

  api.app.update = function (name, callback) {
    wreck.request({
      method: 'PUT',
      path: '/apps/' + name + '/refs',
      statusMappings: {
        404: 'No app found for ' + name
      }
    }, callback)
  }

  api.user.add = function (name, callback) {
    wreck.request({
      method: 'POST',
      path: '/certificates/user',
      payload: {
        user: name
      },
      statusMappings: {
        409: 'A certificate already exists for that user, please remove it with `guv user rm ' + name + '` first',
        412: 'That user does not exist'
      }
    }, callback)
  }

  api.user.remove = function (name, callback) {
    wreck.request({
      method: 'DELETE',
      path: '/certificates/user',
      payload: {
        user: name
      }
    }, callback)
  }

  api.process.list = function (callback) {
    wreck.request({
      method: 'GET',
      path: '/processes'
    }, callback)
  }

  api.process.start = function (script, options, callback) {
    options.script = script

    var name = processNameFromScript(options.name || options.script)

    var tasks = [
      function startProcessRequest (next) {
        logger.debug('Starting process %s', name)
        wreck.request({
          method: 'PUT',
          path: '/processes/' + name,
          payload: {
            status: 'start'
          },
          statusMappings: {
            '409': name + ' is already running'
          }
        }, next)
      }
    ]

    wreck.request({
      method: 'GET',
      path: '/processes/' + name
    }, function (error, response) {
      if (error && error.statusCode !== 404) {
        return callback(error)
      }

      if (response.statusCode === 404) {
        logger.debug('Process %s did not exist, will create it', name)

        // create the process before starting it
        tasks.unshift(
          function createProcessRequest (next) {
            logger.debug('Creating process %s', name)
            wreck.request({
              method: 'POST',
              path: '/processes',
              payload: options
            }, next)
          }
        )
      }

      async.series(tasks, function (error, results) {
        callback(error, results ? results[results.length - 1] : null)
      })
    })
  }

  api.process.stop = function (script, callback) {
    wreck.request({
      method: 'PUT',
      path: '/processes/' + script,
      payload: {
        status: 'stop'
      },
      statusMappings: {
        409: script + ' is not running'
      }
    }, callback)
  }

  api.process.remove = function (script, callback) {
    wreck.request({
      method: 'DELETE',
      path: '/processes/' + script,
      statusMappings: {
        404: 'No process found for ' + script
      }
    }, callback)
  }

  api.process.gc = function (script, callback) {
    wreck.request({
      method: 'POST',
      path: '/processes/' + script + '/gc',
      statusMappings: {
        404: 'No process found for ' + script
      }
    }, callback)
  }

  api.process.takeHeapSnapshot = function (script, callback) {
    wreck.request({
      method: 'POST',
      path: '/processes/' + script + '/heapsnapshot',
      statusMappings: {
        404: 'No process found for ' + script
      }
    }, callback)
  }

  api.process.removeHeapSnapshot = function (script, id, callback) {
    wreck.request({
      method: 'DELETE',
      path: '/processes/' + script + '/heapsnapshot/' + id,
      statusMappings: {
        404: 'No process found for ' + script
      }
    }, callback)
  }

  api.process.getHeapSnapshot = function (script, id, callback) {
    wreck.request({
      method: 'GET',
      path: '/processes/' + script + '/heapsnapshot/' + id,
      statusMappings: {
        404: 'No process found for ' + script
      }
    }, callback)
  }

  api.on('connect', function () {
    logger.debug('Connected to websocket')

    if (callback) {
      callback(null, api)
      callback = null
    }
  })
  api.on('error', function (error) {
    if (callback) {
      api.disconnect()
      api.close()
      callback(error)
      callback = null

      return
    }

    logger.error('Error connecting to websocket', error)
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
    logger.debug('Websocket reconnect error', error.description, error.type)

    // find out what really happened
    if (this.io.engine.transport.polling) {
      logger.debug('Websocket is polling')
      var xhrError = this.io.engine.transport.pollXhr.xhr.statusText

      if (xhrError instanceof Error) {
        logger.debug('Found xhr error on websocket')
        error = xhrError
      }
    }

    if (error.message.indexOf('socket hang up') !== - 1) {
      error = new Error('Invalid certificate')
      error.code = 'EINVALIDCERT'
    }

    api.emit('error', error)
  })
  api.on('reconnect_failed', function () {
    logger.debug('Websocket reconnect failed')
  })
}
