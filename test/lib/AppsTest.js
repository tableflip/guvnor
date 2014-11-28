var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  Apps = require('../../lib/Apps')

describe('Apps', function() {
  var apps, boss, info, error

  beforeEach(function() {
    info = console.info
    error = console.error

    apps = new Apps()
    apps._config = {
      boss: {

      }
    }
    apps._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    apps._user = {

    }
    apps._connect = sinon.stub()
    apps._processes = {
      start: sinon.stub()
    }

    boss = {
      disconnect: sinon.stub(),
      on: sinon.stub()
    }

    apps._connect.callsArgWith(0, undefined, boss)
  })

  afterEach(function() {
    console.info = info
    console.error = error
  })

  it('should deploy an application', function() {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = sinon.stub()
    boss.deployApplication.callsArg(5)

    apps.deployApplication(name, url, options)

    expect(boss.disconnect.called).to.be.true
  })

  it('should relay stdout when deploying an application', function(done) {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = sinon.stub()
    boss.deployApplication.callsArgWith(3, 'foo')

    console.info = function(data) {
      expect(data).to.equal('foo')

      done()
    }

    apps.deployApplication(name, url, options)
  })

  it('should relay stderr when deploying an application', function(done) {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = sinon.stub()
    boss.deployApplication.callsArgWith(4, 'foo')

    console.error = function(data) {
      expect(data).to.equal('foo')

      done()
    }

    apps.deployApplication(name, url, options)
  })

  it('should fail to deploy application', function() {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = sinon.stub()
    apps._connect.callsArgWith(0, undefined, boss)

    boss.deployApplication.callsArgWith(5, new Error('urk!'))

    try {
      apps.deployApplication(name, url, options)
    } catch(e) {
      if(e.message != 'urk!') throw e
    }
  })

  it('should list deployed applications', function(done) {
    var options = {}
    var applications = [{
      name: 'foo'
    }]
    boss.listApplications = sinon.stub()
    boss.listApplications.callsArgWith(0, undefined, applications)

    console.info = function(data) {
      expect(data).to.equal('foo')

      done()
    }

    apps.listApplications(options)
  })

  it('should fail to list deployed applications', function() {
    var options = {}
    boss.listApplications = sinon.stub()
    boss.listApplications.callsArgWith(0, new Error('urk!'))

    try {
      apps.listApplications(options)
    } catch(e) {
      if(e.message != 'urk!') throw e
    }
  })

  it('should remove an application', function() {
    var name = 'foo'
    var options = {}
    boss.removeApplication = sinon.stub()
    boss.removeApplication.withArgs(name, sinon.match.func).callsArgWith(1, undefined)

    apps.removeApplication(name, options)

    expect(boss.disconnect.called).to.be.true
  })

  it('should fail to remove an application', function() {
    var name = 'foo'
    var options = {}
    boss.removeApplication = sinon.stub()
    boss.removeApplication.callsArgWith(1, new Error('urk!'))

    try {
      apps.removeApplication(name, options)
    } catch(e) {
      if(e.message != 'urk!') throw e
    }
  })

  it('should run an application', function() {
    var name = 'foo'
    var ref = 'bar'
    var options = {}
    var info = {
      path: 'path'
    }
    boss.switchApplicationRef = sinon.stub()
    boss.switchApplicationRef.withArgs(name, ref, sinon.match.func).callsArgWith(4, undefined, info)

    apps.runApplication(name, ref, options)

    expect(apps._processes.start.called).to.be.true
  })

  it('should fail to run an application', function() {
    var name = 'foo'
    var ref = 'bar'
    var options = {}
    boss.switchApplicationRef = sinon.stub()
    boss.switchApplicationRef.withArgs(name, ref, sinon.match.func).callsArgWith(4, new Error('urk!'))

    try {
      apps.runApplication(name, ref, options)
    } catch(e) {
      if(e.message != 'urk!') throw e
    }
  })

  it('should relay stdout when running an application', function(done) {
    console.info = function(data) {
      expect(data).to.equal('foo')

      done()
    }

    var name = 'foo'
    var ref = 'bar'
    var options = {}
    boss.switchApplicationRef = sinon.stub()
    boss.switchApplicationRef.withArgs(name, ref, sinon.match.func, sinon.match.func, sinon.match.func).callsArgWith(2, 'foo')

    apps.runApplication(name, ref, options)
  })

  it('should relay stderr when running an application', function(done) {
    console.error = function(data) {
      expect(data).to.equal('foo')

      done()
    }

    var name = 'foo'
    var ref = 'bar'
    var options = {}
    boss.switchApplicationRef = sinon.stub()
    boss.switchApplicationRef.withArgs(name, ref, sinon.match.func, sinon.match.func, sinon.match.func).callsArgWith(3, 'foo')

    apps.runApplication(name, ref, options)
  })

  it('should default to master ref', function() {
    var name = 'foo'
    var options = {}
    boss.switchApplicationRef = sinon.stub()

    apps.runApplication(name, undefined, options)

    expect(boss.switchApplicationRef.withArgs(name, 'master', sinon.match.func, sinon.match.func, sinon.match.func).called).to.be.true
  })
})
