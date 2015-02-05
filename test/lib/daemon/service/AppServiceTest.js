var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  EventEmitter = require('events').EventEmitter,
  AppService = require('../../../../lib/daemon/service/AppService')

describe('AppService', function() {
  var service

  beforeEach(function() {
    service = new AppService()
    service._config = {
      deployments: {
        enabled: true
      }
    }
    service._applicationStore = {
      find: sinon.stub(),
      create: sinon.stub(),
      save: sinon.stub(),
      remove: sinon.stub()
    }
  })

  it('should deploy a project', function(done) {
    var name = 'foo'
    var url = 'bar'
    var user = 'baz'
    var onOut = sinon.stub()
    var onErr = sinon.stub()
    var appInfo = {
      clone: sinon.stub(),
      installDependencies: sinon.stub()
    }

    appInfo.clone.callsArg(2)
    appInfo.installDependencies.callsArg(2)

    service._applicationStore.save.callsArg(0)

    service._applicationStore.create.withArgs([{
      name: name,
      url: url,
      user: user
    }]).callsArgWith(1, undefined, appInfo)

    var eventEmitted = false

    service.once('app:installed', function() {
      eventEmitted = true
    })

    service.deploy(name, url, user, onOut, onErr, function(error) {
      expect(error).to.not.exist
      expect(service._applicationStore.find.withArgs('name', name).called).to.be.true
      expect(eventEmitted).to.be.true

      done()
    })
  })

  it('should not deploy a project with a duplicate name', function(done) {
    var name = 'foo'
    var url = 'bar'
    var user = 'baz'
    var onOut = sinon.stub()
    var onErr = sinon.stub()

    service._applicationStore.find.withArgs('name', name).returns({})

    service.deploy(name, url, user, onOut, onErr, function(error) {
      expect(error.message).to.contain('already exists')

      done()
    })
  })

  it('should pass error encountered when creating an application', function(done) {
    var name = 'foo'
    var url = 'bar'
    var user = 'baz'
    var onOut = sinon.stub()
    var onErr = sinon.stub()
    var appCreationError = new Error('urk!')

    service._applicationStore.create.withArgs([{
      name: name,
      url: url,
      user: user
    }]).callsArgWith(1, appCreationError)

    service.deploy(name, url, user, onOut, onErr, function(error) {
      expect(error).to.equal(appCreationError)

      done()
    })
  })

  it('should remove repo when cloning or installing fails', function(done) {
    var name = 'foo'
    var url = 'bar'
    var user = 'baz'
    var onOut = sinon.stub()
    var onErr = sinon.stub()
    var appInfo = {
      clone: sinon.stub(),
      installDependencies: sinon.stub(),
      remove: sinon.stub()
    }
    var installError = new Error('urk!')

    appInfo.clone.callsArg(2)
    appInfo.installDependencies.callsArgWith(2, installError)
    appInfo.remove.callsArg(0)

    service._applicationStore.create.withArgs([{
      name: name,
      url: url,
      user: user
    }]).callsArgWith(1, undefined, appInfo)

    var eventEmitted = false

    service.once('app:installed', function() {
      eventEmitted = true
    })

    service.deploy(name, url, user, onOut, onErr, function(error) {
      expect(error).to.equal(installError)

      done()
    })
  })
})
