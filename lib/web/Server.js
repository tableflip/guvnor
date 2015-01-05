var Autowire = require('wantsit').Autowire,
  ObjectFactory = require('wantsit').ObjectFactory,
  async = require('async'),
  fs = require('fs'),
  pem = require('pem'),
  http = require('http'),
  os = require('os'),
  Hapi = require('hapi'),
  BasicAuth = require('hapi-auth-basic'),
  Columbo = require('columbo'),
  bcrypt = require('bcrypt'),
  SocketIO = require('socket.io'),
  path = require('path'),
  Moonboots = require('moonboots_hapi')

var Server = function() {
  this._logger = Autowire
  this._config = Autowire
  this._moonbootsConfig = Autowire
}

Server.prototype.containerAware = function(container) {
  this._container = container
}

Server.prototype.afterPropertiesSet = function(done) {
  if(this._moonbootsConfig.isDev) {
    this._logger.info('boss-web is running in DEVELOPMENT mode')
  }

  var tasks = []

  if(this._config.https.enabled) {
    if(this._config.https.key && this._config.https.certificate) {
      tasks.push(this._readCertificates.bind(this))
    } else {
      tasks.push(this._generateCertificates.bind(this))
    }

    if(this._config.https.upgrade) {
      tasks.push(this._startHttpsRedirectServer.bind(this))
    }
  } else {
    this._logger.info('HTTPS is disabled')
  }

  async.series(tasks, function(error, result) {
    if(error) throw error

    var options = {}
    var address = this._config.http.listen
    var port = this._config.http.port

    if(this._config.https.enabled) {
      options.tls = {
        key: result[0].serviceKey,
        cert: result[0].certificate,
        passphrase: result[0].passphrase,
        ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
        honorCipherOrder: true
      }

      address = this._config.https.listen
      port = this._config.https.port
    }

    var hapi = Hapi.createServer(address, port, options)
    hapi.state('config', {
      ttl: null,
      isSecure: this._config.https.enabled,
      encoding: 'none'
    })
    hapi.ext('onPreResponse', function(request, reply) {
      if((request.state &&!request.state.config) && !(request.response instanceof Error)) {
        // copy the this._config
        var clientConfig = JSON.parse(JSON.stringify(this._config.client))

        // add the auth
        clientConfig.auth = request.auth.credentials

        // encode the cookie
        var cookie = encodeURIComponent(JSON.stringify(clientConfig))

        // set the cookie
        return reply(request.response.state('config', cookie))
      } else {
        return reply()
      }
    }.bind(this))
    hapi.pack.register(BasicAuth, function() {
      hapi.auth.strategy('simple', 'basic', true, {
        validateFunc: this._validateUser.bind(this)
      })
    }.bind(this))
    hapi.pack.register({plugin: require('moonboots_hapi'), options: require('./moonboots')(this._moonbootsConfig)}, function (err) {
      if (err) throw err

      hapi.start(function (err) {
        if (err) throw err

        console.log('boss-web is running at: http%s://%s:%d', this._config.https.enabled ? 's' : '', hapi.info.host == '0.0.0.0' ? 'localhost' : hapi.info.host, hapi.info.port)

        // object factories
        this._container.createAndRegister('hostDataFactory', ObjectFactory, [require('./domain/HostData')])
        this._container.createAndRegister('processDataFactory', ObjectFactory, [require('./domain/ProcessData')])

        // holds host data
        this._container.createAndRegister('hostList', require('./components/HostList'))

        // web sockets
        this._container.register('webSocket', SocketIO.listen(hapi.listener))
        this._container.createAndRegister('webSocketResponder', require('./components/WebSocketResponder'))

        done()
      }.bind(this))
    }.bind(this))

    hapi.route({
      method: 'GET',
      path: '/images/{param*}',
      handler: {
        directory: {
          path: path.resolve(__dirname + '/../../web/public/images')
        }
      }
    })
    hapi.route({
      method: 'GET',
      path: '/fonts/{param*}',
      handler: {
        directory: {
          path: path.resolve(__dirname + '/../../web/public/fonts')
        }
      }
    })
    hapi.route({
      method: 'GET',
      path: '/apple-touch-icon.png',
      handler: function (request, reply) {
        reply.file(path.resolve(__dirname + '/../../web/public/apple-touch-icon.png'))
      }
    })

    var columbo = new Columbo({
      resourceDirectory: path.resolve(__dirname + '/resources'),
      resourceCreator: function(resource, name, callback) {
        this._container.createAndRegister(name, resource, callback)
      }.bind(this),
      logger: this._logger
    })

    hapi.route(columbo.discover())
    hapi.start()
  }.bind(this))
}

Server.prototype._generateCertificates = function(callback) {
  this._logger.info('Generating SSL key and certificate')
  pem.createCertificate({
    days: 365,
    selfSigned: true
  }, callback)
}

Server.prototype._readCertificates = function(callback) {
  this._logger.info('Reading SSL key and certificate')

  async.parallel([
    fs.readFile.bind(fs, this._config.https.key, {
      encoding: 'utf8'
    }),
    fs.readFile.bind(fs, this._config.https.certificate, {
      encoding: 'utf8'
    })
  ], function(error, result) {
    callback(error, {
      serviceKey: result[0],
      certificate: result[1],
      passphrase: this._config.https.passphrase
    })
  }.bind(this))
}

Server.prototype._startHttpsRedirectServer = function(callback) {
  this._logger.info('Starting HTTP -> HTTPS upgrade server')

  http.createServer(function(request, response) {
    var host = request.headers.host

    if(!host) {
      host = os.hostname()
    } else {
      host = host.split(':')[0]
    }

    // create an app that will redirect all requests to the https version
    var httpsUrl = 'https://' + host

    if(this._config.https.port != 443) {
      httpsUrl += ':' + this._config.https.port;
    }

    if(request.url) {
      httpsUrl += request.url
    }

    response.setHeader('location', httpsUrl)
    response.statusCode = 302
    response.end()
  }.bind(this)).listen(this._config.http.port, this._config.http.host, function() {
    this._logger.info('HTTP -> HTTPS upgrade server listening on port', this._config.http.port)

    callback()
  }.bind(this))
}

Server.prototype._validateUser = function(username, password, callback) {
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
