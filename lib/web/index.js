var commander = require('commander'),
  pkg = require('../../package.json'),
  path = require('path'),
  prompt = require('prompt'),
  bcrypt = require('bcrypt'),
  pem = require('pem'),
  fs = require('fs'),
  ini = require('ini'),
  mkdirp = require('mkdirp'),
  path = require('path')

colors = require('colors')

function loadUserConfig(file) {
  function load(path) {
    try {
      if(fs.existsSync(path)) {
        return ini.parse(fs.readFileSync(path, 'utf-8'))
      }
    } catch(error) {
      if(error.code != 'EACCES') {
        throw error
      }
    }
  }

  return load('/etc/boss/' + file)
    || load(process.env.HOME + '/.config/boss/' + file)
    || {}
}

function saveUserConfig(file, contents) {
  return witeFileToConfigDirectory(file, ini.stringify(contents))
}

function witeFileToConfigDirectory(file, contents) {
  function write(file) {
    var dir = path.dirname(file)

    try {
      mkdirp.sync(dir, {
        mode: 0700
      })

      fs.writeFileSync(file, contents, {
        mode: 0600
      })
    } catch (error) {
      if (error.code != 'EACCES') {
        throw error
      }

      return false
    }

    return file
  }

  return write('/etc/boss/' + file)
    || write(process.env.HOME + '/.config/boss/' + file)
    || false
}

var CLI = function() {

}

CLI.prototype.generateSalt = function() {
  var config = loadUserConfig('bossweb')
  var users = loadUserConfig('bossweb-users', [])

  if(config.salt && Object.keys(users).length != 0) {
    console.log('Passwords for all users will need to be reset!'.yellow)
  }

  this._generateSalt(config, users)

  saveUserConfig('bossweb', config)
}

CLI.prototype._generateSalt = function(config) {
  config.salt = bcrypt.genSaltSync()
}

CLI.prototype.addUser = function(userName) {
  var config = loadUserConfig('bossweb')

  if(!config.salt) {
    this._generateSalt(config)
    saveUserConfig('bossweb', config)
  }

  var users = loadUserConfig('bossweb-users')

  if(users[userName]) {
    return console.log('A user with the name'.red, userName, 'already exists'.red)
  }

  this._getUserPassword(config, function(error, password) {
    users[userName] = {
      password: password
    }

    saveUserConfig('bossweb-users', users)
  })
}

CLI.prototype.removeUser = function(userName) {
  var users = loadUserConfig('bossweb-users')

  delete users[userName]

  if(!saveUserConfig('bossweb-users', users)) {
    console.log('Could not remove user'.red, userName)
  }
}

CLI.prototype.changeUserPassword = function(userName) {
  var config = loadUserConfig('bossweb')

  if(!config.salt) {
    this._generateSalt(config)
    saveUserConfig('bossweb', config)
  }

  var users = loadUserConfig('bossweb-users')

  if(!users[userName]) {
    return console.log('No user with the name'.red, userName, 'exists'.red)
  }

  this._getUserPassword(config, function(error, password) {
    users[userName].password = password

    saveUserConfig('bossweb-users', users)
  })
}

CLI.prototype.listUsers = function() {
  var users = loadUserConfig('bossweb-users')
  var userNames = Object.keys(users)

  if(userNames.length == 0) {
    console.info('No users')
  } else {
    userNames.forEach(function(userName) {
      console.log(userName)
    })
  }
}

CLI.prototype.generateSSLCertificate = function(days) {
  days = days || 365

  pem.createCertificate({
    days: days,
    selfSigned: true
  }, function(err, keys) {
    var config = loadUserConfig('bossweb')

    config.https = config.https || {}
    config.https.enabled = true
    config.https.key = witeFileToConfigDirectory('ssh.key', keys.serviceKey)
    config.https.certificate = witeFileToConfigDirectory('ssh.cert', keys.certificate)
    config.https.enabled = true

    delete config.https.passphrase

    saveUserConfig('bossweb', config)
  })
}

CLI.prototype._getUserPassword = function(config, callback) {
  prompt.message = ''
  prompt.start()
  prompt.get([{
    name: 'Enter a password (no characters will appear)',
    required: true,
    hidden: true
  }, {
    name: 'Repeat the password',
    required: true,
    hidden: true,
    message: 'Passwords must match',
    conform: function (value) {
      return value == prompt.history('Enter a password (no characters will appear)').value;
    }
  }], function (error, result) {
    var password

    if(!error) {
      password = result['Enter a password (no characters will appear)']
      password = bcrypt.hashSync(password, config.salt)
    }

    callback(error, password)
  }.bind(this))
}

var cli = new CLI()

commander
  .version(pkg.version)

commander
  .command('gensalt')
  .description('Generates a random salt to use for user password')
  .action(cli.generateSalt.bind(cli))

commander
  .command('useradd <username>')
  .alias('adduser')
  .description('Adds a web user')
  .action(cli.addUser.bind(cli))

commander
  .command('rmuser <username>')
  .description('Removes a web user')
  .action(cli.removeUser.bind(cli))

commander
  .command('passwd <username>')
  .description('Sets the password for a web user')
  .action(cli.changeUserPassword.bind(cli))

commander
  .command('lsusers')
  .description('Prints out a list of users')
  .action(cli.listUsers.bind(cli))

commander
  .command('genssl [days]')
  .description('Generates self-signed SSL certificates for boss-web that will expire in the passed number of days (defaults to 365)')
  .action(cli.generateSSLCertificate.bind(cli))

var program = commander.parse(process.argv)

// No command, start the webserver
if(program.args.length === 0) {
  var BossWeb = require('./BossWeb')

  new BossWeb()
}
