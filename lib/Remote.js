var Autowire = require('wantsit').Autowire,
  util = require('util'),
  Actions = require('./Actions')

var Remote = function() {
  Actions.call(this)

  this._os = Autowire
}
util.inherits(Remote, Actions)

Remote.prototype.remoteHostConfig = function(host, options) {
  this._doAdmin('remoteHostConfig', options, function(boss) {
    boss.remoteHostConfig(function(error, hostname, port, user, secret) {
      if(error) throw error

      if(!host) {
        host = hostname.replace(/\./g, '-')
      }

      console.info('')
      console.info('Add the following to your bossweb-hosts file:')
      console.info('')
      console.info('[%s]'.cyan, host)
      console.info('  host = %s'.cyan, hostname)
      console.info('  port = %d'.cyan, port)
      console.info('  user = %s'.cyan, user)
      console.info('  secret = %s'.cyan, secret)
      console.info('')

      boss.disconnect()
    }.bind(this))
  })
}

Remote.prototype.addRemoteUser = function(userName, options) {
  this._doAdmin('addRemoteUser', options, function(boss) {
    boss.addRemoteUser(userName, function(error, user) {
      if(error) {
        if(error.code == 'DUPLICATEUSER') {
          this._logger.error('A user named %s already exists', userName)
          return process.exit(1)
        }

        throw error
      }

      this._logger.debug('Added user', userName, user)

      console.info('')
      console.info('Add the following to your bossweb-users file:')
      console.info('')
      console.info('[%s.%s]'.cyan, userName, this._os.hostname().replace(/\./g, '-'))
      console.info('  secret = %s'.cyan, user.secret)
      console.info('')
      console.info('If %s is not in your config file yet, run `bs-web passwd %s` to generate the appropriate configuration', userName, userName)

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

Remote.prototype.deleteRemoteUser = function(userName, options) {
  this._doAdmin('removeRemoteUser', options, function(boss) {
    boss.removeRemoteUser(userName, function(error) {
      if(error) {
        if(error.code == 'WILLNOTREMOVEBOSSUSER') {
          this._logger.error(error.message)
          return process.exit(1)
        }

        throw error
      }

      this._logger.debug('Removed user', userName)

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

Remote.prototype.listRemoteUsers = function(options) {
  this._doAdmin('listRemoteUsers', options, function(boss) {
    boss.listRemoteUsers(function(error, users) {
      if(error) throw error

      if(users.length == 0) {
        console.info('No remote users')
      } else {
        users.forEach(function(user) {
          console.info(user.name)
        })
      }

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

Remote.prototype.rotateRemoteUserKeys = function(userName, options) {
  this._doAdmin('rotateRemoteUserKeys', options, function(boss) {
    boss.rotateRemoteUserKeys(userName, function(error, user) {
      if(error) throw error

      this._logger.debug('Removed user', userName)

      console.info('')
      console.info('Update your bossweb-users file with the following:')
      console.info('')
      console.info('[%s.%s]'.cyan, userName, this._os.hostname().replace(/\./g, '-'))
      console.info('  secret = %s'.cyan, user.secret)
      console.info('')

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

Remote.prototype.generateSSLCertificate = function(days, options) {
  days = days || 365

  this._doAdmin('generateRemoteRpcCertificates', options, function(boss) {
    boss.generateRemoteRpcCertificates(days, function(error, location) {
      if(error) throw error

      console.info('')
      console.info('SSL keys generated and stored at', location)
      console.info('Please restart boss for the changes to take effect.')
      console.info('')

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

module.exports = Remote
