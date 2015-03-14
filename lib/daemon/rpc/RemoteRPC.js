var Autowire = require('wantsit').Autowire
var path = require('path')
var async = require('async')
var shortid = require('shortid')

var RemoteRPC = function () {
  this._logger = Autowire
  this._guvnor = Autowire
  this._processService = Autowire
  this._appService = Autowire
  this._dnode = Autowire
  this._config = Autowire
  this._remoteUserService = Autowire
  this._crypto = Autowire
  this._child_process = Autowire
  this._package = Autowire
  this._os = Autowire
  this._pem = Autowire
  this._tls = Autowire
  this._fs = Autowire
  this._mdns = Autowire
  this._userDetailsFactory = Autowire

  this._connections = {}
}

RemoteRPC.prototype.afterPropertiesSet = function (done) {
  if (!this._config.remote.enabled) {
    return done()
  }

  this.port = this._config.remote.port

  this._startMdnsAdvertisment()
  this._startDNode(done)

  this._guvnor.on('*', this.broadcast.bind(this))
  this._processService.on('*', this.broadcast.bind(this))
  this._appService.on('*', this.broadcast.bind(this))
}

RemoteRPC.prototype._startMdnsAdvertisment = function () {
  if (!this._config.remote.advertise) {
    return
  }

  // mdns is an optional dependency so require at runtime and wrap in try/catch
  try {
    var advert = this._mdns.createAdvertisement(this._mdns.tcp('guvnor-rpc'), this.port)
    advert.start()
  } catch (e) {
    this._logger.warn('Creating MDNS advertisment failed', e.message)
  }
}

RemoteRPC.prototype._startDNode = function (callback) {
  // by default generate a certificate
  var resolveKeys = function (callback) {
    this._pem.createCertificate({
      days: 365,
      selfSigned: true
    }, callback)
  }.bind(this)

  // the user has specified keys so use them
  if (this._config.remote.key && this._config.remote.certificate) {
    resolveKeys = function (callback) {
      async.parallel([
        this._fs.readFile.bind(this._fs, this._config.remote.key),
        this._fs.readFile.bind(this._fs, this._config.remote.certificate)
      ], function (error, result) {
        if (error) return callback(error)

        callback(undefined, {
          serviceKey: result[0],
          certificate: result[1],
          passphrase: this._config.remote.passphrase
        })
      }.bind(this))
    }.bind(this)
  }

  resolveKeys(function (error, result) {
    if (error) return callback(error)

    this._loadedKeys(result, callback)
  }.bind(this))
}

RemoteRPC.prototype._loadedKeys = function (keys, callback) {
  var self = this

  var server = this._tls.createServer({
    key: keys.serviceKey,
    cert: keys.certificate,
    passphrase: keys.passphrase,
    ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    honorCipherOrder: true
  }, function (stream) {
    var d = this._dnode(function (client, connection) {
      d._id = shortid.generate()

      // store connection
      self._connections[d._id] = client

      // make sure we get rid of the connection when the client goes away
      connection.on('end', function (id) {
        delete this._connections[id]
        this._logger.debug('client connection', id, 'ended')
      }.bind(self, d._id))
      connection.on('error', function (id, error) {
        delete this._connections[id]
        this._logger.debug('client connection', id, 'erred', error)
      }.bind(self, d._id))

      // generate api
      this.findProcessInfoById = self._checkSignature.bind(self, self._guvnor.findProcessInfoById.bind(self._guvnor))
      this.getServerStatus = self._checkSignature.bind(self, self._guvnor.getServerStatus.bind(self._guvnor))
      this.listProcesses = self._checkSignature.bind(self, self._guvnor.listProcesses.bind(self._guvnor))
      this.deployApplication = self._checkSignature.bind(self, function (userDetails, name, url, onOut, onErr, callback) {
        // slightly different API - we get the user name from the authentication
        // details instead of letting the client specify it
        self._guvnor.deployApplication(userDetails, name, url, userDetails.name, onOut, onErr, callback)
      })
      this.removeApplication = self._checkSignature.bind(self, self._guvnor.removeApplication.bind(self._guvnor))
      this.listApplications = self._checkSignature.bind(self, self._guvnor.listApplications.bind(self._guvnor))
      this.switchApplicationRef = self._checkSignature.bind(self, self._guvnor.switchApplicationRef.bind(self._guvnor))
      this.listApplicationRefs = self._checkSignature.bind(self, self._guvnor.listApplicationRefs.bind(self._guvnor))
      this.updateApplicationRefs = self._checkSignature.bind(self, self._guvnor.updateApplicationRefs.bind(self._guvnor))
      this.startProcess = self._checkSignature.bind(self, self._guvnor.startProcess.bind(self._guvnor))
      this.removeProcess = self._checkSignature.bind(self, self._guvnor.removeProcess.bind(self._guvnor))
      this._connectToProcess = self._checkSignature.bind(self, self.connectToProcess.bind(self))

      this.getDetails = self._checkSignature.bind(self, self._getDetails.bind(self))
    }, {
      timeout: this._config.guvnor.rpctimeout
    })
    d.pipe(stream).pipe(d)

    stream.on('error', function (id, error) {
      this._logger.warn('Client stream errored', error)

      delete this._connections[d._id]
    }.bind(this))
  }.bind(this))

  process.nextTick(server.listen.bind(server, this._config.remote.port, this._config.remote.host, callback))
}

RemoteRPC.prototype._checkSignature = function () {
  var args = Array.prototype.slice.call(arguments)
  var method = args.shift()
  var signature = args.shift()
  var callback = args[args.length - 1]

  if (typeof callback !== 'function') {
    callback = function () {}
  }

  var signatureError = new Error('Request rejected')
  signatureError.code = 'INVALIDSIGNATURE'

  if (!signature.principal || !signature.date || !signature.hash || !signature.nonce) {
    this._logger.warn('Invalid signature format')

    return callback(signatureError)
  }

  this._remoteUserService.findUser(signature.principal, function (error, user) {
    if (error) {
      this._logger.warn(error)

      return callback(signatureError)
    }

    if (!user) {
      this._logger.warn('Unknown user', signature.principal)

      return callback(signatureError)
    }

    this._userDetailsFactory.create([user.name], function (error, userDetails) {
      if (error) {
        this._logger.warn('Could not create user details', error)

        return callback(signatureError)
      }

      args.unshift(userDetails)

      if (this._crypto.verify(signature, user.secret)) {
        method.apply(null, args)
      } else {
        this._logger.warn('Signature failed verification')

        callback(signatureError)
      }
    }.bind(this))
  }.bind(this))
}

RemoteRPC.prototype._generateApi = function () {
  return {}
}

RemoteRPC.prototype._getDetails = function (userDetails, callback) {
  var details = {
    hostname: this._os.hostname(),
    type: this._os.type(),
    platform: this._os.platform(),
    arch: this._os.arch(),
    release: this._os.release(),
    versions: process.versions,
    guvnor: this._package.version
  }

  this._child_process.exec('uname -a', function (error, stdout) {
    var os = 'unknown'

    if (!error && stdout) {
      stdout = stdout.toLowerCase()

      if (stdout.indexOf('centos') !== -1) {
        os = 'centos'
      } else if (stdout.indexOf('darwin') !== -1) {
        os = 'darwin'
      } else if (stdout.indexOf('debian') !== -1) {
        os = 'debian'
      } else if (stdout.indexOf('fedora') !== -1) {
        os = 'fedora'
      } else if (stdout.indexOf('freebsd') !== -1) {
        os = 'freebsd'
      } else if (stdout.indexOf('mint') !== -1) {
        os = 'mint'
      } else if (stdout.indexOf('netbsd') !== -1) {
        os = 'netbsd'
      } else if (stdout.indexOf('raspberrypi') !== -1) {
        os = 'raspberrypi'
      } else if (stdout.indexOf('redhat') !== -1) {
        os = 'redhat'
      } else if (stdout.indexOf('solaris') !== -1 || stdout.indexOf('sunos') !== -1) {
        os = 'solaris'
      } else if (stdout.indexOf('suse') !== -1) {
        os = 'suse'
      } else if (stdout.indexOf('ubuntu') !== -1) {
        os = 'ubuntu'
      } else if (stdout.indexOf('linux') !== -1) {
        os = 'linux'
      }
    }

    details.os = os

    callback(undefined, details)
  })
}

RemoteRPC.prototype.connectToProcess = function (userDetails, processId, callback) {
  // can't invoke method directly as this process runs as a privileged user.
  // instead spawn a new process and get it to drop privileges to the same
  // user as the one connected via RPC.
  this._guvnor.findProcessInfoById(userDetails, processId, function (error, processInfo) {
    if (error) return callback(error)
    if (!processInfo) return callback(new Error('No process for id ' + processId))

    var env = {
      GUVNOR_USER: userDetails.name,
      GUVNOR_SOCKET: processInfo.socket,
      GUVNOR_TIMEOUT: this._config.guvnor.timeout,
      GUVNOR_RPC_TIMEOUT: this._config.guvnor.rpctimeout
    }

    var afterMethodInvocationCallback

    var child = this._child_process.fork(
      path.resolve(__dirname, './remote'), {
        execArgv: [],
        env: env,
        uid: userDetails.uid,
        gid: userDetails.gid
      })
    child.on('message', function (message) {
      if (message.event === 'remote:ready') {
        var remote = {}
        var methods = ['kill', 'restart', 'send', 'reportStatus', 'dumpHeap', 'forceGc', 'setClusterWorkers', 'write']
        methods.forEach(function (key) {
          remote[key] = function () {
            var args = Array.prototype.slice.call(arguments)

            if (typeof args[args.length - 1] === 'function') {
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

        if (callback) {
          callback(undefined, remote)
        }

        callback = null

        return
      }

      if (afterMethodInvocationCallback) {
        if (message.event === 'remote:success') {
          afterMethodInvocationCallback.apply(afterMethodInvocationCallback, message.args)
        } else if (message.event === 'remote:error') {
          var error = new Error(message.args[0].message)
          error.code = message.args[0].code
          error.stack = message.args[0].stack

          afterMethodInvocationCallback(error)
        }
      }

      child.kill()
    })
    child.on('error', function (error) {
      if (callback) callback(error)

      callback = null
    })
    child.on('exit', function (code) {
      if (code !== 0 && callback) {
        if (code === 143) {
          callback(new Error('Process exited with code ' + code + '. Can ' + userDetails.name + ' su to ' + processInfo.user + '?'))
        } else {
          callback(new Error('Process exited with code ' + code))
        }

        callback = null
      }
    })
  }.bind(this))
}

RemoteRPC.prototype.broadcast = function () {
  var args = Array.prototype.slice.call(arguments)

  Object.keys(this._connections).forEach(function (id) {
    var client = this._connections[id]

    if (!client || !client.sendEvent) {
      return
    }

    client.sendEvent.apply(client, args)
  }.bind(this))
}

module.exports = RemoteRPC
