const SocketIO = require('socket.io-client')
const addWildcards = require('socketio-wildcard')(SocketIO.Manager)
const App = require('ampersand-app')
const jquery = require('jquery')
const logger = require('andlog')
const url = require('url')

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
    xhrFields: {
      withCredentials: true
    },
    success: function (result) {
      for (var key in result) {
        data[key] = result[key]
      }

      data.lastUpdated = new Date()
      data.status = 'connected'

      updateProcesses(data)
      .then(() => setTimeout(updateSystem.bind(null, data), UPDATE_INTERVAL))
    },
    error: handleError.bind(null, data, updateSystem)
  })
}

function updateProcesses (data) {
  return new Promise((resolve, reject) => {
    var host = App.hosts.get(data.url, 'url')
    host.processes.fetch({
      success: () => {
        host.lastUpdated = new Date()
        data.status = 'connected'

        resolve()
      },
      error: (collection, response) => {
        console.error('failed to update processes', response)

        resolve()
      }
    })
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

  var socket = SocketIO(remote)
  addWildcards(socket)

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
