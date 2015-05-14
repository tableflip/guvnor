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
  this._userDetailsStore = Autowire
  this._fileSystem = Autowire
}

AppInfo.prototype.afterPropertiesSet = function (done) {
  this._userDetailsStore.findOrCreate('name', this.user, [this.user], function (error, user) {
    if (error) return done(error)

    Object.defineProperties(this, {
      '_user': {
        value: user
      },
      'path': {
        value: this._fileSystem.getAppDir() + '/' + this.id
      }
    })

    this._fs.exists(this.path, function (exists) {
      if (!exists) {
        return done()
      }

      this.currentRef(function (error, ref) {
        if (!error) {
          this.ref = ref
        }

        done()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

AppInfo.prototype.clone = function (onOut, onErr, callback) {
  async.series([
    this._commandLine.git.bind(this._commandLine, ['clone', '--mirror', this.url, this.path + '/.git'], path.resolve(this.path, '../'), this._user, onOut, onErr, 'Cloning ' + this.url + ' failed'),
    this._commandLine.git.bind(this._commandLine, ['config', 'core.bare', 'false'], this.path + '/.git', this._user, onOut, onErr, 'Changing repository ' + this.path + ' to non-bare failed'),
    this.reset.bind(this, onOut, onErr),
    this.installDependencies.bind(this, onOut, onErr)
  ], function (error, results) {
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

    if (error) {
      return callback(error)
    }

    this.currentRef(function (error, ref) {
      if (!error) {
        this.ref = ref
      }

      callback(error)
    }.bind(this))
  }.bind(this))
}

AppInfo.prototype.checkout = function (ref, onOut, onErr, callback) {
  async.series([
    this.currentRef.bind(this),
    this.reset.bind(this, onOut, onErr),
    this._commandLine.git.bind(this._commandLine, ['checkout', ref], this.path, this._user, onOut, onErr, 'Checking out ' + ref + ' in ' + this.path + ' failed'),
    this.currentRef.bind(this)
  ], function (error, results) {
    if (error) {
      return callback(error)
    }

    if (results[0][1] === results[3][1]) {
      // our commit id has not changed, do not update anything
      return callback(error, this)
    }

    this.installDependencies(onOut, onErr, callback)
  }.bind(this))
}

AppInfo.prototype.remove = function (callback) {
  this._rimraf(this.path, callback)
}

AppInfo.prototype.listRefs = function (callback) {
  var output = ''
  var refs = []

  var branchPrefix = 'refs/heads/'
  var tagPrefix = 'refs/tags/'

  var startsWith = function (string, thing) {
    return string.substring(0, thing.length) === thing
  }

  var without = function (string, thing) {
    return string.substring(thing.length)
  }

  this._commandLine.git(['show-ref'], this.path, this._user, function (data) {
    output += data
  }, function () {}, 'Listing refs in ' + this.url + ' failed', function (error) {
    if (!error) {
      output.split('\n').forEach(function (line) {
        var parts = line.trim().split(' ')

        if (parts.length !== 2) {
          return
        }

        var ref = {
          name: parts[1].trim(),
          commit: parts[0].trim()
        }

        if (startsWith(ref.name, branchPrefix)) {
          ref.isBranch = true
          ref.name = without(ref.name, branchPrefix)
        }

        if (startsWith(ref.name, tagPrefix)) {
          ref.isTag = true
          ref.name = without(ref.name, tagPrefix)
        }

        refs.push(ref)
      })
    }

    callback(error, refs)
  })
}

AppInfo.prototype.currentRef = function (callback) {
  var output = ''

  async.parallel([
    this._commandLine.git.bind(this._commandLine, ['rev-parse', 'HEAD'], this.path, this._user, function (data) {
      output += data
    }, function () {}, 'Finding the current HEAD in ' + this.url + ' failed'),
    this.listRefs.bind(this)
  ], function (error, result) {
    if (error) {
      return callback(error)
    }

    var commit = output.trim()

    result[1].some(function (ref) {
      if (ref.commit === commit) {
        this.ref = ref.name

        return true
      }
    }.bind(this))

    callback(error, this.ref, commit)
  }.bind(this))
}

AppInfo.prototype.updateRefs = function (onOut, onErr, callback) {
  async.series([
    this.reset.bind(this, onOut, onErr),
    this._commandLine.git.bind(this._commandLine, ['config', 'core.bare', 'true'], this.path + '/.git', this._user, onOut, onErr, 'Changing repository ' + this.path + ' to bare failed'),
    this._commandLine.git.bind(this._commandLine, ['remote', 'update', '--prune'], this.path + '/.git', this._user, onOut, onErr, 'Updating remote history from ' + this.url + ' for ' + this.name + ' failed'),
    this._commandLine.git.bind(this._commandLine, ['config', 'core.bare', 'false'], this.path + '/.git', this._user, onOut, onErr, 'Changing repository ' + this.path + ' to non-bare failed'),
    this.reset.bind(this, onOut, onErr),
    this.checkout.bind(this, this.ref, onOut, onErr),
    this.listRefs.bind(this)
  ], function (error, results) {
    onOut('current ref now', this.ref)
    callback(error, this, error ? undefined : results[6])
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

AppInfo.prototype.reset = function (onOut, onErr, callback) {
  async.series([
    this._commandLine.git.bind(this._commandLine, ['reset', '--hard', 'HEAD'], this.path, this._user, onOut, onErr, 'Resetting ' + this.path + ' failed'),
    this._commandLine.git.bind(this._commandLine, ['clean', '-d', '-f'], this.path, this._user, onOut, onErr, 'Cleaning repository ' + this.path + ' failed')
  ], callback)
}

module.exports = AppInfo
