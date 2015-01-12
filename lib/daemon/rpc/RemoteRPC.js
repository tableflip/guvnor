var Autowire = require('wantsit').Autowire,
  path = require('path'),
  async = require('async'),
  shortid = require('shortid')

var RemoteRPC = function() {
  this._logger = Autowire
  this._boss = Autowire
  this._processService = Autowire
  this._appService = Autowire
  this._dnode = Autowire
  this._config = Autowire
  this._remoteUserService = Autowire
  this._crypto = Autowire
  this._child_process = Autowire
  this._package = Autowire
  this._nodeInspectorWrapper = Autowire
  this._os = Autowire
  this._pem = Autowire
  this._tls = Autowire
  this._fs = Autowire
  this._mdns = Autowire

  this._connections = {}
}

RemoteRPC.prototype.afterPropertiesSet = function(done) {
  if(!this._config.remote.enabled) {
    return done()
  }

  this.port = this._config.remote.port

  this._startMdnsAdvertisment()
  this._startDNode(done)

  this._boss.on('*', this.broadcast.bind(this))
  this._processService.on('*', this.broadcast.bind(this))
  this._appService.on('*', this.broadcast.bind(this))
}

RemoteRPC.prototype._startMdnsAdvertisment = function() {
  if(!this._config.remote.advertise) {
    return
  }

  // mdns is an optional dependency so require at runtime and wrap in try/catch
  try {
    var advert = this._mdns.createAdvertisement(this._mdns.tcp('boss-rpc'), this.port)
    advert.start()
  } catch(e) {
    this._logger.warn('Creating MDNS advertisment failed', e.message)
  }
}

RemoteRPC.prototype._startDNode = function(callback) {
  // by default generate a certificate
  var resolveKeys = function(callback) {
    this._pem.createCertificate({
      days: 365,
      selfSigned: true
    }, callback)
  }.bind(this)

  // the user has specified keys so use them
  if(this._config.remote.key && this._config.remote.certificate) {
    resolveKeys = function(callback) {
      async.parallel([
        this._fs.readFile.bind(this._fs, this._config.remote.key),
        this._fs.readFile.bind(this._fs, this._config.remote.certificate)
      ], function(error, result) {
        if(error) return callback(error)

        callback(undefined, {
          serviceKey: result[0],
          certificate: result[1],
          passphrase: this._config.remote.passphrase
        })
      }.bind(this))
    }.bind(this)
  }

  resolveKeys(function(error, result) {
    if(error) return callback(error)

    this._loadedKeys(result, callback)
  }.bind(this))
}

RemoteRPC.prototype._loadedKeys = function(keys, callback) {
  var self = this

  var server = this._tls.createServer({
    key: keys.serviceKey,
    cert: keys.certificate,
    passphrase: keys.passphrase,
    ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    honorCipherOrder: true
  }, function(stream) {
    var d = this._dnode(function(client, connection) {
      d._id = shortid.generate()

      // store connection
      self._connections[d._id] = client

      // make sure we get rid of the connection when the client goes away
      connection.on('end', function(id) {
        delete this._connections[id]
        this._logger.debug('client connection', id, 'ended')
      }.bind(self, d._id))
      connection.on('error', function(id, error) {
        delete this._connections[id]
        this._logger.debug('client connection', id, 'erred', error)
      }.bind(self, d._id))

      // generate api
      this.findProcessInfoById = self._checkSignature.bind(self, self._boss.findProcessInfoById.bind(self._boss))
      this.getServerStatus = self._checkSignature.bind(self, self._boss.getServerStatus.bind(self._boss))
      this.listProcesses = self._checkSignature.bind(self, self._boss.listProcesses.bind(self._boss))
      this.deployApplication = self._checkSignature.bind(self, function(name, url, onOut, onErr, callback, user) {
        // slightly different API - we get the user name from the authentication
        // details instead of letting the client specify it
        self._boss.deployApplication(name, url, user.name, onOut, onErr, callback)
      })
      this.removeApplication = self._checkSignature.bind(self, self._boss.removeApplication.bind(self._boss))
      this.listApplications = self._checkSignature.bind(self, self._boss.listApplications.bind(self._boss))
      this.switchApplicationRef = self._checkSignature.bind(self, self._boss.switchApplicationRef.bind(self._boss))
      this.listApplicationRefs = self._checkSignature.bind(self, self._boss.listApplicationRefs.bind(self._boss))
      this.updateApplicationRefs = self._checkSignature.bind(self, self._boss.updateApplicationRefs.bind(self._boss))
      this.startProcess = self._checkSignature.bind(self, self._boss.startProcess.bind(self._boss))
      this.removeProcess = self._checkSignature.bind(self, self._boss.removeProcess.bind(self._boss))
      this._connectToProcess = self._checkSignature.bind(self, self.connectToProcess.bind(self))

      this.getDetails = self._checkSignature.bind(self, function(callback) {
        callback(undefined, {
          hostname: this._os.hostname(),
          type: this._os.type(),
          platform: this._os.platform(),
          arch: this._os.arch(),
          release: this._os.release(),
          version: this._package.version
        })
      }.bind(self))
    })
    d.pipe(stream).pipe(d)

    stream.on('error', function(id, error) {
      this._logger.warn('Client stream errored', error)

      delete this._connections[d._id]
    }.bind(this))
  }.bind(this))

  process.nextTick(server.listen.bind(server, this._config.remote.port, this._config.remote.host, callback))
}

RemoteRPC.prototype._checkSignature = function() {
  var args = Array.prototype.slice.call(arguments)
  var callback = args.shift()
  var signature = args.shift()
  var remoteCallback = args[args.length - 1]

  if(typeof remoteCallback != 'function') {
    remoteCallback = function(){}
  }

  var signatureError = new Error('Request rejected')
  signatureError.code = 'INVALIDSIGNATURE'

  if(!signature.principal || !signature.date || !signature.hash || !signature.nonce) {
    this._logger.warn('Invalid signature format')

    return remoteCallback(signatureError)
  }

  this._remoteUserService.findUser(signature.principal, function(error, user) {
    if(error) {
      this._logger.warn(error)

      return remoteCallback(signatureError)
    }

    if(!user) {
      this._logger.warn('Unknown user', signature.principal)

      return remoteCallback(signatureError)
    }

    args.push(user)

    if(this._crypto.verify(signature, user.secret)) {
      callback.apply(callback, args)
    } else {
      this._logger.warn('Signature failed verification')

      remoteCallback(signatureError)
    }
  }.bind(this))
}

RemoteRPC.prototype._generateApi = function() {
  return {}
}

RemoteRPC.prototype.connectToProcess = function(processId, callback, user) {
  // can't invoke method directly as this process runs as a privileged user.
  // instead spawn a new process and get it to drop privileges to the same
  // user as the one connected via RPC.
  this._boss.findProcessInfoById(processId, function(error, processInfo) {
    if(error) return callback(error)
    if(!processInfo) return callback(new Error('No process for id ' + processId))

    var env = {
      BOSS_USER: user.name,
      BOSS_SOCKET: processInfo.socket
    }

    var afterMethodInvocationCallback

    var child = this._child_process.fork(
      path.resolve(__dirname, './remote'),
      [], {
        execArgv: [],
        env: env
      })
    child.on('message', function(message) {
      if(message.type == 'remote:ready') {
        var remote = {}
        var methods = ['kill', 'restart', 'send', 'reportStatus', 'dumpHeap', 'forceGc', 'setClusterWorkers']
        methods.forEach(function(key) {
          remote[key] = function() {
            var args = Array.prototype.slice.call(arguments)

            if(typeof args[args.length - 1] == 'function') {
              afterMethodInvocationCallback = args.pop()
            } else {
              afterMethodInvocationCallback = null
            }

            child.send({
              type: 'invoke',
              method: key,
              args: args
            })
          }
        })

        if(callback) {
          callback(undefined, remote)
        }

        callback = null

        return
      }

      if(afterMethodInvocationCallback) {
        if(message.type == 'remote:success') {
          afterMethodInvocationCallback.apply(afterMethodInvocationCallback, message.args)
        } else if(message.type == 'remote:error') {
          var error = new Error(message.message)
          error.stack = message.stack

          afterMethodInvocationCallback(error)
        }
      }

      child.kill()
    })
    child.on('error', function(error) {
      if(callback) callback(error)

      callback = null
    }.bind(this))
    child.on('exit', function(code) {
      if(code !== 0 && callback) {
        if(code == 143) {
          callback(new Error('Process exited with code ' + code + '. Can ' + user.name + ' su to ' + processInfo.user + '?'))
        } else {
          callback(new Error('Process exited with code ' + code))
        }

        callback = null
      }
    }.bind(this))
  }.bind(this))
}

RemoteRPC.prototype.broadcast = function() {
  var args = Array.prototype.slice.call(arguments)

  Object.keys(this._connections).forEach(function(id) {
    var client = this._connections[id]

    if(!client || !client.sendEvent) {
      return
    }

    client.sendEvent.apply(client, args)
  }.bind(this))
}

module.exports = RemoteRPC
