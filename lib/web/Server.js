var Autowire = require('wantsit').Autowire
var async = require('async')
var fs = require('fs')
var pem = require('pem')
var http = require('http')
var os = require('os')
var Hapi = require('hapi')
var BasicAuth = require('hapi-auth-basic')
var Columbo = require('columbo')
var bcrypt = require('bcrypt')
var SocketIO = require('socket.io')
var path = require('path')
var MoonBootsHapi = require('moonboots_hapi')
var MoonBootsConfig = require('./moonboots')
var Tv = require('tv')

var Server = function () {
  this._logger = Autowire
  this._config = Autowire
  this._moonbootsConfig = Autowire
}

Server.prototype.containerAware = function (container) {
  this._container = container
}

Server.prototype.afterPropertiesSet = function (done) {
  if (this._moonbootsConfig.isDev) {
    this._logger.info('guvnor-web is running in DEVELOPMENT mode')
  }

  var tasks = []

  if (this._config.https.enabled) {
    if (this._config.https.key && this._config.https.certificate) {
      tasks.push(this._readCertificates.bind(this))
    } else {
      tasks.push(this._generateCertificates.bind(this))
    }

    if (this._config.https.upgrade) {
      tasks.push(this._startHttpsRedirectServer.bind(this))
    }
  } else {
    this._logger.info('HTTPS is disabled')
  }

  async.series(tasks, function (error, result) {
    if (error)
      throw error

    var options = {
      address: this._config.http.listen,
      port: this._config.http.port,
      host: 'localhost'
    }

    if (this._config.https.enabled) {
      options.tls = {
        key: result[0].serviceKey,
        cert: result[0].certificate,
        passphrase: result[0].passphrase,
        ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
        honorCipherOrder: true
      }

      options.address = this._config.https.listen
      options.port = this._config.https.port
    }

    var hapi = new Hapi.Server()
    hapi.connection(options)
    hapi.state('config', {
      ttl: null,
      isSecure: this._config.https.enabled,
      encoding: 'none'
    })
    hapi.ext('onPreResponse', function setClacksOverhead(request, reply) {
      if (request.response instanceof Error) {
        return reply.continue()
      }

      request.response.header('X-Clacks-Overhead', 'GNU Terry Pratchett')

      return reply.continue()
    })
    hapi.ext('onPreResponse', function setConfigCookie(request, reply) {
      if (request.response instanceof Error) {
        return reply.continue()
      }

      var cookie

      if (request.state && request.state.config) {
        try {
          cookie = JSON.parse(decodeURIComponent(request.state.config))
        } catch (error) {
          // don't care if the cookie is invalid
        }
      }

      if (!cookie || !cookie.auth) {
        // copy the this._config
        var clientConfig = JSON.parse(JSON.stringify(this._config.client))

        // add the auth
        clientConfig.auth = request.auth.credentials

        // encode the cookie
        cookie = encodeURIComponent(JSON.stringify(clientConfig))

        // set the cookie
        return reply(request.response.state('config', cookie))
      }

      return reply.continue()
    }.bind(this))

    async.auto({
      add_auth: function (callback) {
        hapi.register(BasicAuth, function (error) {
          hapi.auth.strategy('simple', 'basic', {
            validateFunc: this._validateUser.bind(this)
          })
          callback(error)
        }.bind(this))
      }.bind(this),
      add_rest: ['add_auth', function (callback) {
        var columbo = new Columbo({
          resourceDirectory: path.resolve(__dirname + '/resources'),
          resourceCreator: function (resource, name, callback) {
            this._container.createAndRegister(name, resource, function (error, result) {
              callback(error, result)
            })
          }.bind(this),
          preProcessor: function (resource, callback) {
            // secure resources
            resource.config = {
              auth: 'simple'
            }

            callback(undefined, resource)
          },
          logger: this._logger
        })
        columbo.discover(function (error, resources) {
          if (error) return callback(error)

          hapi.route(resources)
          callback()
        })
      }.bind(this)],
      add_tv: ['add_auth', function (callback) {
        if (!this._moonbootsConfig.isDev) {
          return callback()
        }

        hapi.register({
          register: Tv,
          options: {
            port: 10000
          }
        }, callback)
      }.bind(this)],
      add_moonboots: ['add_auth', function (callback) {
        hapi.register({
          register: MoonBootsHapi,
          options: MoonBootsConfig(this._moonbootsConfig)
        }, callback)
      }.bind(this)],
      add_static: ['add_auth', function (callback) {
        hapi.route({
          method: 'GET',
          path: '/images/{param*}',
          handler: {
            directory: {
              path: path.resolve(__dirname + '/../../web/public/images')
            }
          },
          config: {
            auth: 'simple'
          }
        })
        hapi.route({
          method: 'GET',
          path: '/fonts/{param*}',
          handler: {
            directory: {
              path: path.resolve(__dirname + '/../../web/public/fonts')
            }
          },
          config: {
            auth: 'simple'
          }
        })
        hapi.route({
          method: 'GET',
          path: '/apple-touch-icon.png',
          handler: function (request, reply) {
            reply.file(path.resolve(__dirname + '/../../web/public/apple-touch-icon.png'))
          },
          config: {
            auth: 'simple'
          }
        })

        callback()
      }]
    }, function (error) {
      if (error) return done(error)

      hapi.start(function (error) {
        if (error) return done(error)

        this._logger.info('guvnor-web is running at: http%s://%s:%d', this._config.https.enabled ? 's' : '', hapi.info.host === '0.0.0.0' ? 'localhost' : hapi.info.host, hapi.info.port)

        // web sockets
        this._container.register('webSocket', SocketIO.listen(hapi.listener))
        this._container.createAndRegister('webSocketResponder', require('./components/WebSocketResponder'))

        this._container.once('ready', function () {
          this._logger.info('guvnor-web ready')
        }.bind(this))

        done()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

Server.prototype._generateCertificates = function (callback) {
  this._logger.info('Generating SSL key and certificate')
  pem.createCertificate({
    days: 365,
    selfSigned: true
  }, callback)
}

Server.prototype._readCertificates = function (callback) {
  this._logger.info('Reading SSL key and certificate')

  async.parallel([
    fs.readFile.bind(fs, this._config.https.key, {
      encoding: 'utf8'
    }),
    fs.readFile.bind(fs, this._config.https.certificate, {
      encoding: 'utf8'
    })
  ], function (error, result) {
    callback(error, {
      serviceKey: result[0],
      certificate: result[1],
      passphrase: this._config.https.passphrase
    })
  }.bind(this))
}

Server.prototype._startHttpsRedirectServer = function (callback) {
  this._logger.info('Starting HTTP -> HTTPS upgrade server')

  http.createServer(function (request, response) {
    var host = request.headers.host

    if (!host) {
      host = os.hostname()
    } else {
      host = host.split(':')[0]
    }

    // create an app that will redirect all requests to the https version
    var httpsUrl = 'https://' + host

    if (this._config.https.port !== 443) {
      httpsUrl += ':' + this._config.https.port
    }

    if (request.url) {
      httpsUrl += request.url
    }

    response.setHeader('location', httpsUrl)
    response.statusCode = 302
    response.end()
  }.bind(this)).listen(this._config.http.port, this._config.http.host, function () {
    this._logger.info('HTTP -> HTTPS upgrade server listening on port', this._config.http.port)

    callback()
  }.bind(this))
}

Server.prototype._validateUser = function (username, password, callback) {
  var user = this._config.users[username]

  if (!user) {
    return callback(null, false)
  }

  bcrypt.compare(password, user.password, function (error, isValid) {
    callback(error, isValid, {
      user: username
    })
  })
}

module.exports = Server
