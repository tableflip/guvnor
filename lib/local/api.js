'use strict'

const logger = require('winston')
const processNameFromScript = require('../common/process-name-from-script')
const io = require('socket.io-client')
const addWildcards = require('socketio-wildcard')(io.Manager)
const daemonRestConnection = require('../common/daemon-rest-connection')
const noop = () => {}

module.exports = function loadApi (keyBundle) {
  return new Promise((resolve, reject) => {
    if (!keyBundle || !keyBundle.certificate || !keyBundle.key || !keyBundle.ca) {
      return reject(new Error('No keybundle supplied'))
    }

    const daemon = daemonRestConnection({
      certificate: keyBundle.certificate,
      key: keyBundle.key,
      ca: keyBundle.ca
    })
    const socket = daemon.url.replace('https', 'wss')

    const request = (options) => {
      return new Promise((resolve, reject) => {
        daemon.request(options, (error, result) => {
          if (error) {
            return reject(error)
          }

          resolve(result)
        })
      })
    }

    logger.debug('Connecting to REST server', daemon.url)
    logger.debug('Connecting to websocket', socket)

    const api = io(socket, {
      cert: keyBundle.cert,
      key: keyBundle.key,
      ca: keyBundle.ca,
      forceNew: true
    })
    addWildcards(api)

    // api namespaces
    api.app = {

    }
    api.user = {

    }
    api.process = {

    }

    api.app.install = (url, name, output) => {
      return request({
        method: 'POST',
        path: '/apps',
        payload: {
          url: url,
          name: name
        },
        output: output || noop
      })
    }

    api.app.list = () => {
      return request({
        method: 'GET',
        path: '/apps'
      })
    }

    api.app.get = (name) => {
      return request({
        method: 'GET',
        path: `/apps/${name}`,
        statusMappings: {
          404: `No app found for ${name}`
        }
      })
    }

    api.app.remove = (name) => {
      return request({
        method: 'DELETE',
        path: `/apps/${name}`,
        statusMappings: {
          404: `No app found for ${name}`
        }
      })
    }

    api.app.ref = (name) => {
      return request({
        method: 'GET',
        path: `/apps/${name}/ref`,
        statusMappings: {
          404: `No app found for ${name}`
        }
      })
    }

    api.app.refs = (name) => {
      return request({
        method: 'GET',
        path: `/apps/${name}/refs`,
        statusMappings: {
          404: `No app found for ${name}`
        }
      })
    }

    api.app.update = (name, output) => {
      return request({
        method: 'PUT',
        path: `/apps/${name}/refs`,
        output: output || noop,
        statusMappings: {
          404: `No app found for ${name}`,
          409: `App ${name} was running`
        }
      })
    }

    api.app.setRef = (name, ref, output) => {
      return request({
        method: 'PATCH',
        path: `/apps/${name}`,
        output: output || noop,
        payload: {
          ref: ref
        },
        statusMappings: {
          404: `No app found for ${name}`
        }
      })
    }

    api.user.add = (name) => {
      return request({
        method: 'POST',
        path: `/certificates/user/${name}`,
        payload: {}
      })
    }

    api.user.remove = (name) => {
      return request({
        method: 'DELETE',
        path: `/certificates/user/${name}`
      })
    }

    api.user.list = () => {
      return request({
        method: 'GET',
        path: '/users'
      })
    }

    api.process.get = (name) => {
      return request({
        method: 'GET',
        path: `/processes/${name}`
      })
    }

    api.process.list = () => {
      return request({
        method: 'GET',
        path: '/processes'
      })
    }

    api.process.start = (script, options) => {
      options = options || {}
      options.script = script

      const name = processNameFromScript(options.name || options.script)

      delete options.name

      logger.debug(`Starting process ${name}`)

      return api.process.get(name)
      .then((process) => {
        if (!process) {
          logger.debug(`Process ${name} did not exist, will create it`)

          return request({
            method: 'POST',
            path: `/processes/${name}`,
            payload: options
          })
        }
      })
      .then(() => request({
        method: 'PATCH',
        path: `/processes/${name}`,
        payload: {
          status: 'start'
        },
        statusMappings: {
          '404': `No process found for ${name}`,
          '409': `${name} is already running`
        }
      }))
    }

    api.process.stop = (name) => {
      return request({
        method: 'PATCH',
        path: `/processes/${name}`,
        payload: {
          status: 'stop'
        },
        statusMappings: {
          409: `${name} is not running`
        }
      })
    }

    api.process.remove = (name) => {
      return request({
        method: 'DELETE',
        path: `/processes/${name}`,
        statusMappings: {
          404: `No process found for ${name}`
        }
      })
    }

    api.process.workers = (name, count) => {
      return request({
        method: 'PATCH',
        path: `/processes/${name}`,
        payload: {
          workers: count
        },
        statusMappings: {
          409: `${name} is not running`
        }
      })
    }

    api.process.gc = (script) => {
      return request({
        method: 'POST',
        path: `/processes/${script}/gc`,
        statusMappings: {
          404: `No process found for ${script}`
        }
      })
    }

    api.process.takeHeapSnapshot = (script) => {
      return request({
        method: 'POST',
        path: `/processes/${script}/heapsnapshots`,
        statusMappings: {
          404: `No process found for ${script}`
        }
      })
    }

    api.process.removeHeapSnapshot = (script, id) => {
      return request({
        method: 'DELETE',
        path: `/processes/${script}/heapsnapshots/${id}`,
        statusMappings: {
          404: `No process found for ${script}`
        }
      })
    }

    api.process.getHeapSnapshot = (script, id, onData) => {
      return request({
        method: 'GET',
        path: `/processes/${script}/heapsnapshots/${id}`,
        statusMappings: {
          404: `No process found for ${script}`
        },
        data: onData
      })
    }

    api.process.listHeapSnapshots = (script) => {
      return request({
        method: 'GET',
        path: `/processes/${script}/heapsnapshots`,
        statusMappings: {
          404: `No process found for ${script}`
        }
      })
    }

    api.process.logs = (script, follow, output) => {
      return request({
        method: 'GET',
        path: `/processes/${script}/logs`,
        query: {
          follow: follow
        },
        output: output || noop,
        statusMappings: {
          404: `No process found for ${script}`
        }
      })
    }

    api.process.sendEvent = (script, event, args, worker) => {
      return request({
        method: 'POST',
        path: `/processes/${script}/events`,
        payload: {
          event: event,
          args: args,
          worker: worker
        },
        statusMappings: {
          404: `No process found for ${script}`,
          409: `${script} was not running`
        }
      })
    }

    api.process.sendSignal = (script, signal, kill, worker) => {
      return request({
        method: 'POST',
        path: `/processes/${script}/signals`,
        payload: {
          signal: signal,
          kill: kill,
          worker: worker
        },
        statusMappings: {
          404: `No process found for ${script}`,
          409: `${script} was not running`
        }
      })
    }

    api.status = () => {
      return request({
        method: 'GET',
        path: '/'
      })
    }

    api.logs = (output, follow) => {
      return request({
        method: 'GET',
        path: '/processes/logs',
        output: output || noop,
        query: {
          follow: !!follow
        }
      })
    }

    api.on('connect', () => {
      logger.debug('Connected to websocket')

      if (resolve) {
        resolve(api)
        resolve = null
        reject = null
      }
    })
    api.on('error', (error) => {
      logger.error('Error connecting to websocket', error)

      if (reject) {
        api.disconnect()
        api.close()
        reject(error)
        resolve = null
        reject = null

        return
      }
    })
    api.on('disconnect', () => {
      logger.debug('Websocket disconnect')
    })
    api.on('reconnect', (attempt) => {
      logger.debug(`Websocket reconnect #${attempt}`)
    })
    api.on('reconnect_attempt', () => {
      logger.debug('Websocket reconnect attempt')
    })
    api.on('reconnecting', (attempt) => {
      logger.debug(`Websocket reconnecting #${attempt}`)
    })
    api.on('reconnect_error', function (error) {
      logger.debug(`Websocket reconnect error ${error.description} ${error.type}`)

      // find out what really happened
      if (this.io.engine.transport.polling) {
        logger.debug('Websocket is polling')
        const xhrError = this.io.engine.transport.pollXhr.xhr.statusText

        if (xhrError instanceof Error) {
          logger.debug('Found xhr error on websocket')
          error = xhrError
        }
      }

      if (error.message.indexOf('socket hang up') !== -1) {
        error = new Error('Invalid certificate')
        error.code = 'EINVALIDCERT'
      }

      api.emit('error', error)
    })
    api.on('reconnect_failed', () => {
      logger.debug('Websocket reconnect failed')
    })
  })
}
