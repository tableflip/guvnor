var Autowire = require('wantsit').Autowire
var util = require('util')
var Actions = require('./Actions')

var Remote = function () {
  Actions.call(this)

  this._os = Autowire
}
util.inherits(Remote, Actions)

Remote.prototype.remoteHostConfig = function (host, options) {
  this._doAdmin('remoteHostConfig', options, function (guvnor) {
    guvnor.remoteHostConfig(function (error, hostname, port, user, secret) {
      if (error)
        throw error

      if (!host) {
        host = hostname.replace(/\./g, '-')
      }

      console.info('')
      console.info('Add the following to your guvnor-web-hosts file:')
      console.info('')
      console.info('[%s]'.cyan, host)
      console.info('  host = %s'.cyan, hostname)
      console.info('  port = %d'.cyan, port)
      console.info('  user = %s'.cyan, user)
      console.info('  secret = %s'.cyan, secret)
      console.info('')

      guvnor.disconnect()
    })
  })
}

Remote.prototype.addRemoteUser = function (userName, options) {
  this._doAdmin('addRemoteUser', options, function (guvnor) {
    guvnor.addRemoteUser(userName, function (error, user) {
      if (error) {
        if (error.code === 'DUPLICATEUSER') {
          this._logger.error('A user named %s already exists', userName)
          return process.exit(1)
        }

        throw error
      }

      this._logger.debug('Added user', userName, user)

      console.info('')
      console.info('Add the following to your guvnor-web-users file:')
      console.info('')
      console.info('[%s.%s]'.cyan, userName, this._os.hostname().replace(/\./g, '-'))
      console.info('  secret = %s'.cyan, user.secret)
      console.info('')
      console.info('If %s is not in your config file yet, run `guv-web passwd %s` to generate the appropriate configuration', userName, userName)

      guvnor.disconnect()
    }.bind(this))
  }.bind(this))
}

Remote.prototype.deleteRemoteUser = function (userName, options) {
  this._doAdmin('removeRemoteUser', options, function (guvnor) {
    guvnor.removeRemoteUser(userName, function (error) {
      if (error) {
        if (error.code === 'WILLNOTREMOVEGUVNORUSER') {
          this._logger.error(error.message)
          return process.exit(1)
        }

        throw error
      }

      this._logger.debug('Removed user', userName)

      guvnor.disconnect()
    }.bind(this))
  }.bind(this))
}

Remote.prototype.listRemoteUsers = function (options) {
  this._doAdmin('listRemoteUsers', options, function (guvnor) {
    guvnor.listRemoteUsers(function (error, users) {
      if (error)
        throw error

      if (users.length === 0) {
        console.info('No remote users')
      } else {
        users.forEach(function (user) {
          console.info(user.name)
        })
      }

      guvnor.disconnect()
    })
  })
}

Remote.prototype.rotateRemoteUserKeys = function (userName, options) {
  this._doAdmin('rotateRemoteUserKeys', options, function (guvnor) {
    guvnor.rotateRemoteUserKeys(userName, function (error, user) {
      if (error)
        throw error

      this._logger.debug('Removed user', userName)

      console.info('')
      console.info('Update your guvnor-web-users file with the following:')
      console.info('')
      console.info('[%s.%s]'.cyan, userName, this._os.hostname().replace(/\./g, '-'))
      console.info('  secret = %s'.cyan, user.secret)
      console.info('')

      guvnor.disconnect()
    }.bind(this))
  }.bind(this))
}

Remote.prototype.generateSSLCertificate = function (days, options) {
  days = days || 365

  this._doAdmin('generateRemoteRpcCertificates', options, function (guvnor) {
    guvnor.generateRemoteRpcCertificates(days, function (error, location) {
      if (error)
        throw error

      console.info('')
      console.info('SSL keys generated and stored at', location)
      console.info('Please restart guvnor for the changes to take effect.')
      console.info('')

      guvnor.disconnect()
    })
  })
}

module.exports = Remote
