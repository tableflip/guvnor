'use strict'

const config = require('clientconfig')
const hostUpdater = require('./host')
const app = require('ampersand-app')
const notify = require('./notification')
const SocketIO = require('socket.io-client')
const addWildcards = require('socketio-wildcard')(SocketIO.Manager)

const withHostAndProcess = (hostName, processId, callback) => {
  withHost(hostName, (host) => {
    const process = host.processes.get(processId)

    if (!process) {
      return
    }

    callback(host, process)
  })
}

const withHost = (hostName, callback) => {
  var host = app.hosts.get(hostName)

  if (!host) {
    return
  }

  callback(host)
}

const updateProcess = (hostName, processInfo) => {
  withHost(hostName, host => host.processes.addOrUpdate(processInfo))
}

const socket = SocketIO('//')
addWildcards(socket)

if (config.debugMode) {
  socket.on('*', (context) => {
    const args = context.data

    if (args[0].substring(0, 'process:log'.length) !== 'process:log' &&
      args[0].substring(0, 'server:status'.length) !== 'server:status' &&
      args[0].substring(0, 'server:processes'.length) !== 'server:processes'
    ) {
      console.info('incoming!', arguments)
    }
  })

  socket.on('connect_error', error => console.info('connect_error', error))
  socket.on('reconnect_attempt', () => console.info('reconnect_attempt'))
  socket.on('reconnecting', count => console.info('reconnecting', count))
  socket.on('reconnect_error', error => console.info('reconnect_error', error))
  socket.on('reconnect_failed', () => console.info('reconnect_failed'))
  socket.on('event', function () {
    console.info('event', arguments)
  })
}

socket.on('host', url => hostUpdater(url))

socket.on('connect_timeout', () => {
  notify({
    header: 'Connection timeout',
    message: 'The websocket timed out while connecting to the server',
    type: 'danger'
  })
})
socket.on('reconnect', count => {
  notify({
    header: 'Server came back',
    message: ['Reconnected after %d attempts', count],
    type: 'info'
  })
})
socket.on('disconnect', () => {
  notify({
    header: 'Server went away',
    message: 'Lost connection',
    type: 'danger'
  })
})
socket.on('disconnected', hostName => {
  notify({
    header: 'Lost connection',
    message: ['Disconnected from %s', hostName],
    type: 'danger'
  })
})
socket.on('process:log', (hostName, processInfo, log) => {
  withHostAndProcess(hostName, processInfo.id, function (host, process) {
    if (process.logsStatus !== 'loaded') {
      return
    }

    process.logs += log
  })
})
socket.on('process:uncaughtexception', (hostName, processInfo, error) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.exceptions.add({
      id: error.id,
      date: error.date,
      code: error.code,
      message: error.message,
      stack: error.stack
    })
  })
})
socket.on('server:status', (hostName, data) => {
  var newHost = !app.hosts.get(hostName)
  var host = app.hosts.add(data, {
    merge: true
  })

  if (newHost) {
    host.apps.fetch()

    host.on('change:status', (host, value) => {
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
socket.on('server:processes', (hostName, processes) => {
  withHost(hostName, host => {
    processes.forEach(host.processes.addOrUpdate.bind(host.processes))

    host.processes.forEach(existingProcess => {
      var present = processes.some(process => {
        return (process.workers && process.workers.some(worker => {
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
socket.on('process:gc:start', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.isGc = true
  })
})
socket.on('process:gc:complete', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.isGc = false
  })
})
socket.on('process:heapdump:start', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.isHeapDump = true
  })
})
socket.on('process:heapdump:complete', (hostName, processInfo, heapDump) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.isHeapDump = false
    process.snapshots.add(heapDump)
  })
})
socket.on('process:heapdump:error', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.isHeapDump = false
  })
})
socket.on('process:heapdump:removed', (hostName, processInfo, heapDump) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.snapshots.remove(heapDump)
  })
})
socket.on('process:restarting', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.isRestarting = true
  })
})
socket.on('process:restarted', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.isRestarting = false
  })
})
socket.on('process:exit', (hostName, processInfo) => {
  updateProcess(processInfo)

  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    process.snapshots.reset()
  })
})
socket.on('app:installed', (hostName, processInfo) => {
  withHost(hostName, host => {
    host.apps.add(appInfo)
  })
})
socket.on('app:removed', (hostName, processInfo) => {
  withHost(hostName, host => {
    host.apps.remove(appInfo.id)
  })
})
socket.on('app:refs:switched', (hostName, appInfo, oldRef, newRef) => {
  withHost(hostName, host => {
    var app = host.apps.add(appInfo)
    app.ref = newRef
  })
})
socket.on('process:aborted', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    notify({
      header: 'Aborted',
      message: ['%s restarted too many times and was aborted', process.name],
      type: 'danger'
    })
  })
})
socket.on('cluster:aborted', (hostName, processInfo) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
    notify({
      header: 'Aborted',
      message: ['%s restarted too many times and was aborted', process.name],
      type: 'danger'
    })
  })
})
socket.on('process:failed', (hostName, processInfo, error) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
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
socket.on('process:errored', (hostName, processInfo, error) => {
  withHostAndProcess(hostName, processInfo.id, (host, process) => {
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
