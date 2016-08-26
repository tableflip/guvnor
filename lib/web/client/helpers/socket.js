var config = require('clientconfig')
var hostUpdater = require('./host')
var app = require('ampersand-app')
var notify = require('./notification')
var SocketIO = require('socket.io-client')
var addWildcards = require('socketio-wildcard')(SocketIO.Manager)

function withHostAndProcess (hostName, processId, callback) {
  withHost(hostName, function (host) {
    var process = host.processes.get(processId)

    if (!process) {
      return
    }

    callback(host, process)
  })
}

function withHost (hostName, callback) {
  var host = app.hosts.get(hostName)

  if (!host) {
    return
  }

  callback(host)
}

function updateProcess (hostName, processInfo) {
  withHost(hostName, function (host) {
    host.processes.addOrUpdate(processInfo)
  })
}

var socket = SocketIO('//')
addWildcards(socket)

if (config.debugMode) {
  socket.on('*', function () {
    if (arguments[0].substring(0, 'process:log'.length) !== 'process:log' &&
      arguments[0].substring(0, 'server:status'.length) !== 'server:status' &&
      arguments[0].substring(0, 'server:processes'.length) !== 'server:processes'
    ) {
      console.info('incoming!', arguments)
    }
  })

  socket.on('connect_error', function (error) {
    console.info('connect_error', error)
  })
  socket.on('reconnect_attempt', function () {
    console.info('reconnect_attempt')
  })
  socket.on('reconnecting', function (count) {
    console.info('reconnecting', count)
  })
  socket.on('reconnect_error', function (error) {
    console.info('reconnect_error', error)
  })
  socket.on('reconnect_failed', function () {
    console.info('reconnect_failed')
  })
  socket.on('event', function () {
    console.info('event', arguments)
  })
}

socket.on('host', function (url) {
  hostUpdater(url)
})

socket.on('connect_timeout', function () {
  notify({
    header: 'Connection timeout',
    message: 'The websocket timed out while connecting to the server',
    type: 'danger'
  })
})
socket.on('reconnect', function (count) {
  notify({
    header: 'Server came back',
    message: ['Reconnected after %d attempts', count],
    type: 'info'
  })
})
socket.on('disconnect', function () {
  notify({
    header: 'Server went away',
    message: 'Lost connection',
    type: 'danger'
  })
})
socket.on('disconnected', function (hostName) {
  notify({
    header: 'Lost connection',
    message: ['Disconnected from %s', hostName],
    type: 'danger'
  })
})
socket.on('process:log', function (hostName, processInfo, log) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    if (process.logsStatus !== 'loaded') {
      return
    }

    process.logs += log
  })
})
socket.on('process:uncaughtexception', function (hostName, processInfo, error) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.exceptions.add({
      id: error.id,
      date: error.date,
      code: error.code,
      message: error.message,
      stack: error.stack
    })
  })
})
socket.on('server:status', function (hostName, data) {
  var newHost = !app.hosts.get(hostName)
  var host = app.hosts.add(data, {
    merge: true
  })

  if (newHost) {
    host.apps.fetch()

    host.on('change:status', function (host, value) {
      if (value !== 'connected') {
        host.processes.reset()

        var sub = '/host/' + hostName + '/process'

        if (window.location.pathname.substring(0, sub.length) === sub) {
          app.navigate('/host/' + hostName)
        }
      }
    })
  }
})
socket.on('server:processes', function (hostName, processes) {
  withHost(hostName, function (host) {
    processes.forEach(host.processes.addOrUpdate.bind(host.processes))

    host.processes.forEach(function (existingProcess) {
      var present = processes.some(function (process) {
        return (process.workers && process.workers.some(function (worker) {
          return worker.id === existingProcess.id
        })) || process.id === existingProcess.id
      })

      if (!present) {
        host.processes.remove(existingProcess)
      }
    })
  })
})

// listen for events for these properties as they could have been initiated by another user
socket.on('process:gc:start', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.isGc = true
  })
})
socket.on('process:gc:complete', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.isGc = false
  })
})
socket.on('process:heapdump:start', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.isHeapDump = true
  })
})
socket.on('process:heapdump:complete', function (hostName, processInfo, heapDump) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.isHeapDump = false
    process.snapshots.add(heapDump)
  })
})
socket.on('process:heapdump:error', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.isHeapDump = false
  })
})
socket.on('process:heapdump:removed', function (hostName, processInfo, heapDump) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.snapshots.remove(heapDump)
  })
})
socket.on('process:restarting', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.isRestarting = true
  })
})
socket.on('process:restarted', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.isRestarting = false
  })
})
socket.on('process:exit', function (hostName, processInfo) {
  updateProcess(processInfo)

  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    process.snapshots.reset()
  })
})
socket.on('app:installed', function (hostName, appInfo) {
  withHost(hostName, function (host) {
    host.apps.add(appInfo)
  })
})
socket.on('app:removed', function (hostName, appInfo) {
  withHost(hostName, function (host) {
    host.apps.remove(appInfo.id)
  })
})
socket.on('app:refs:switched', function (hostName, appInfo, oldRef, newRef) {
  withHost(hostName, function (host) {
    var app = host.apps.add(appInfo)
    app.ref = newRef
  })
})
socket.on('process:aborted', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    notify({
      header: 'Aborted',
      message: ['%s restarted too many times and was aborted', process.name],
      type: 'danger'
    })
  })
})
socket.on('cluster:aborted', function (hostName, processInfo) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    notify({
      header: 'Aborted',
      message: ['%s restarted too many times and was aborted', process.name],
      type: 'danger'
    })
  })
})
socket.on('process:failed', function (hostName, processInfo, error) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    host.processes.addOrUpdate(processInfo)

    process.exceptions.add({
      id: error.id,
      date: error.date,
      code: error.code,
      message: error.message,
      stack: error.stack
    })
  })
})
socket.on('process:errored', function (hostName, processInfo, error) {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    host.processes.addOrUpdate(processInfo)

    process.exceptions.add({
      id: error.id,
      date: error.date,
      code: error.code,
      message: error.message,
      stack: error.stack
    })
  })
})

// these events are informational so just update the process
socket.on('cluster:failed', updateProcess)
socket.on('process:starting', updateProcess)
socket.on('cluster:starting', updateProcess)
socket.on('process:started', updateProcess)
socket.on('cluster:started', updateProcess)
socket.on('process:ready', updateProcess)
socket.on('process:stopping', updateProcess)
socket.on('cluster:stopping', updateProcess)
socket.on('cluster:errored', updateProcess)
socket.on('process:restarting', updateProcess)
socket.on('cluster:restarting', updateProcess)
socket.on('cluster:exit', updateProcess)

module.exports = socket
