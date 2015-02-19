var Autowire = require('wantsit').Autowire,
  util = require('util'),
  Actions = require('./Actions'),
  Table = require('./Table'),
  OutputBuffer = require('output-buffer')

var Apps = function() {
  Actions.call(this)

  this._user = Autowire
  this._processes = Autowire
}
util.inherits(Apps, Actions)

Apps.prototype.installApplication = function(url, name, options) {
  this._do(options, function(guvnor) {
    var user = options.user || this._user.name

    var infoBuffer = new OutputBuffer(console.info)
    var errorBuffer = new OutputBuffer(function(line) {
      console.error(line.red)
    })

    guvnor.deployApplication(name, url, user, infoBuffer.append.bind(infoBuffer), errorBuffer.append.bind(errorBuffer),
      function(error) {
        infoBuffer.flush()
        errorBuffer.flush()

        if(error) throw error

        guvnor.disconnect()
      })
  }.bind(this))
}

Apps.prototype.listApplications = function(options) {
  this._do(options, function(guvnor) {
    guvnor.listApplications(function(error, deployedApplications) {
      if(error) throw error

      var table = new Table('No applications have been installed')
      table.addHeader(['Name', 'User', 'URL'])

      deployedApplications.forEach(function(app) {
        table.addRow([app.name, app.user, app.url.grey])
      })

      table.print(console.info)

      guvnor.disconnect()
    })
  }.bind(this))
}

Apps.prototype.removeApplication = function(name, options) {
  this._do(options, function(guvnor) {
    guvnor.removeApplication(name, function(error) {
      if(error) throw error

      guvnor.disconnect()
    })
  }.bind(this))
}

Apps.prototype.runApplication = function(name, ref, options) {
  ref = ref || 'master'

  this._do(options, function(guvnor) {
    guvnor.switchApplicationRef(name, ref, console.info, console.error,
      function(error, applicationInfo) {
        if(error) throw error

        options.name = name
        options.app = applicationInfo.id

        this._processes.start(applicationInfo.path, options)
      }.bind(this))
  }.bind(this))
}

Apps.prototype.listRefs = function(name, options) {
  this._do(options, function(guvnor) {
    guvnor.listApplicationRefs(name, function(error, refs) {
      if(error) throw error

      var table = new Table(name + ' has no refs')
      table.addHeader(['Name', 'Commit'])

      refs.forEach(function(ref) {
        table.addRow([ref.name, ref.commit.grey])
      })

      table.print(console.info)

      guvnor.disconnect()
    })
  }.bind(this))
}

Apps.prototype.updateRefs = function(name, options) {
  this._do(options, function(guvnor) {
    var infoBuffer = new OutputBuffer(console.info)
    var errorBuffer = new OutputBuffer(function(line) {
      console.error(line.red)
    })

    guvnor.updateApplicationRefs(name, infoBuffer.append.bind(infoBuffer), errorBuffer.append.bind(errorBuffer), function(error) {
      infoBuffer.flush()
      errorBuffer.flush()

      if(error) throw error

      guvnor.disconnect()
    })
  }.bind(this))
}

Apps.prototype.setRef = function(name, ref, options) {
  this._do(options, function(guvnor) {
    var infoBuffer = new OutputBuffer(console.info)
    var errorBuffer = new OutputBuffer(function(line) {
      console.error(line.red)
    })

    guvnor.switchApplicationRef(name, ref, infoBuffer.append.bind(infoBuffer), errorBuffer.append.bind(errorBuffer), function(error) {
      infoBuffer.flush()
      errorBuffer.flush()

      if(error) throw error

      guvnor.disconnect()
    })
  }.bind(this))
}

module.exports = Apps
