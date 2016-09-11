var Emitter = require('component-emitter')
var App = require('ampersand-app')

// if (config.debugMode) {
  // only extend if we're in debug mode
Emitter.prototype.emit = function (event) {
  this._callbacks = this._callbacks || {}

  var argsWithoutEvent = Array.prototype.slice.call(arguments, 1)
  var argsWithEvent = Array.prototype.slice.call(arguments, 0)

  for (var eventName in this._callbacks) {
    if (!Array.isArray(this._callbacks[eventName])) {
      continue
    }

    var callbacks = this._callbacks[eventName].slice()
    var hasWildCard = eventName.indexOf('*') !== -1
    var subEvent = eventName.split('*')[0]

    if (eventName === event) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].apply(this, argsWithoutEvent)
      }
    } else if (hasWildCard && event.substring(0, subEvent.length) === subEvent) {
      for (var n = 0; n < callbacks.length; n++) {
        callbacks[n].apply(this, argsWithEvent)
      }
    }
  }
}
// }

var SocketIO = require('socket.io-client')
var jquery = require('jquery')
var logger = require('andlog')
var url = require('url')

var UPDATE_INTERVAL = 5000

var XML_HTTP_REQUEST_STATUSES = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4
}

function handleError (data, retry, xmlHttpRequest, textStatus, errorThrown) {
  data.lastUpdated = new Date()

  if (xmlHttpRequest.readyState === XML_HTTP_REQUEST_STATUSES.UNSENT) {
    // encountered a network error
    logger.warn('network error', data.url)
    data.status = 'network-error'
  } else if (xmlHttpRequest.readyState === XML_HTTP_REQUEST_STATUSES.DONE) {
    if (xmlHttpRequest.status === 401) {
      // the certificate was bad
      data.status = 'auth-error'
    } else if (xmlHttpRequest.status === 403) {
      // the certificate was rejected
      data.status = 'auth-rejected'
    } else {
      // encountered a server error
      logger.warn('server error', data.url)
      data.status = 'server-error'
    }
  }

  setTimeout(retry.bind(null, data), UPDATE_INTERVAL)
}

function updateSystem (data) {
  jquery.ajax(data.url, {
    method: 'GET',
    withCredentials: true,
    success: function (result) {
      for (var key in result) {
        data[key] = result[key]
      }

      data.lastUpdated = new Date()
      data.status = 'connected'

      setTimeout(updateSystem.bind(null, data), UPDATE_INTERVAL)
    },
    error: handleError.bind(null, data, updateSystem)
  })
}

function updateProcesses (data) {
  var host = App.hosts.get(data.url, 'url')
  host.processes.fetch({
    success: function () {
      host.lastUpdated = new Date()
      data.status = 'connected'

      setTimeout(updateProcesses.bind(null, data), UPDATE_INTERVAL)
    },
    error: function (collection, response) {
      console.error('failed to update processes', response)

      setTimeout(updateProcesses.bind(null, data), UPDATE_INTERVAL)
    }
  })
}

module.exports = function monitorRemoteHost (remote) {
  if (App.hosts.get(remote, 'url')) {
    return
  }

  var data = {
    name: url.parse(remote).host,
    url: remote,
    lastUpdated: new Date(),
    status: 'connecting'
  }

  logger.info('adding host', remote, data)

  data = App.hosts.add(data, {
    merge: true
  })

  updateSystem(data)
  updateProcesses(data)

  var socket = SocketIO(remote)

  // if (config.debugMode) {
  socket.on('*', function () {
    if (arguments[0].substring(0, 'process:log'.length) !== 'process:log' &&
        arguments[0].substring(0, 'server:status'.length) !== 'server:status' &&
        arguments[0].substring(0, 'server:processes'.length) !== 'server:processes'
      ) {
      console.info('incoming!', arguments)
    }
  })
  // }
}
