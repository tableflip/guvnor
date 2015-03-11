var Autowire = require('wantsit').Autowire
var async = require('async')
var path = require('path')
var shortId = require('shortid')

var AppInfo = function (options) {
  if (!options) {
    throw new Error('Please pass an options object to AppInfo constructor')
  }

  // make sure we don't keep shared references around
  options = JSON.parse(JSON.stringify(options))

  if (!options.url) {
    throw new Error('No url specified')
  }

  if (!options.user) {
    throw new Error('No user specified')
  }

  // enumerable properties
  this.id = options.id || shortId.generate()
  this.url = options.url
  this.user = options.user
  this.name = options.name

  this._rimraf = Autowire
  this._commandLine = Autowire
  this._logger = Autowire
  this._fs = Autowire
  this._userDetailsFactory = Autowire
  this._fileSystem = Autowire
}

AppInfo.prototype.afterPropertiesSet = function (done) {
  this._userDetailsFactory.create([this.user], function (error, user) {
    if (error) return done(error)

    Object.defineProperties(this, {
      '_user': {
        value: user
      },
      'path': {
        value: this._fileSystem.getAppDir() + '/' + this.id
      }
    })

    done()
  }.bind(this))
}

AppInfo.prototype.clone = function (onOut, onErr, callback) {
  this._commandLine.git(['clone', this.url, this.path], path.resolve(this.path, '../'), this._user, onOut, onErr, 'Cloning ' + this.url + ' failed', function (error) {
    if (!error && !this.name) {
      try {
        // get name from package.json
        var pkg = require(this.path + '/package.json')
        this.name = pkg.name
      } catch (e) {
        error = new Error('You did not specify an application name and your application does not have a valid package.json file to get the name from. Please either specify a name or fix your application.')
        error.code = e.code
        error.stack = e.stack
      }
    }

    callback(error)
  }.bind(this))
}

AppInfo.prototype.checkout = function (ref, onOut, onErr, callback) {
  async.series([
    this._commandLine.git.bind(this._commandLine, ['reset', '--hard', 'HEAD'], this.path, this._user, onOut, onErr, 'Resetting ' + this.path + ' failed'),
    this._commandLine.git.bind(this._commandLine, ['clean', '-d', '-f'], this.path, this._user, onOut, onErr, 'Cleaning repository ' + this.path + ' failed'),
    this._commandLine.git.bind(this._commandLine, ['checkout', ref], this.path, this._user, onOut, onErr, 'Checking out ' + ref + ' in ' + this.path + ' failed')
  ], function (error) {
    callback(error, this)
  }.bind(this))
}

AppInfo.prototype.remove = function (callback) {
  this._rimraf(this.path, callback)
}

AppInfo.prototype.listRefs = function (callback) {
  var output = ''
  var refs = []

  this._commandLine.git(['show-ref'], this.path, this._user, function (data) {
    output += data
  }, function () {}, 'Listing refs in ' + this.url + ' failed', function (error) {
    if (!error) {
      output.split('\n').forEach(function (line) {
        var parts = line.trim().split(' ')

        if (parts.length !== 2) {
          return
        }

        refs.push({
          name: parts[1].trim(),
          commit: parts[0].trim()
        })
      })
    }

    callback(error, refs)
  })
}

AppInfo.prototype.currentRef = function (callback) {
  var output = ''
  var refs = []

  this._commandLine.git(['rev-parse', '--abbrev-ref', 'HEAD'], this.path, this._user, function (data) {
    output += data
  }, function () {}, 'Listing refs in ' + this.url + ' failed', function (error) {
    callback(error, output.trim())
  })
}

AppInfo.prototype.updateRefs = function (onOut, onErr, callback) {
  async.series([
    this._commandLine.git.bind(this._commandLine, ['reset', '--hard', 'HEAD'], this.path, this._user, onOut, onErr, 'Resetting ' + this.path + ' failed'),
    this._commandLine.git.bind(this._commandLine, ['clean', '-d', '-f'], this.path, this._user, onOut, onErr, 'Cleaning repository ' + this.path + ' failed'),
    this._commandLine.git.bind(this._commandLine, ['pull'], this.path, this._user, onOut, onErr, 'Pulling from ' + this.url + ' upstream history for ' + this.name + ' failed'),
    this.listRefs.bind(this)
  ], function (error, results) {
    callback(error, this, error ? undefined : results[3])
  }.bind(this))
}

AppInfo.prototype.installDependencies = function (onOut, onErr, callback) {
  this._fs.exists(this.path + '/package.json', function (exists) {
    if (!exists) {
      // nothing to install..
      return process.nextTick(callback)
    }

    async.series([
      this._rimraf.bind(this._rimraf, this.path + '/node_modules'),
      this._commandLine.npm.bind(this._commandLine, ['install', '--production', '--spin=false', '--loglevel=http', '--color=false'], this.path, this._user, onOut, onErr, 'Installing ' + this.name + ' dependencies failed')
    ], function (error) {
      callback(error, this)
    }.bind(this))
  }.bind(this))
}

module.exports = AppInfo
