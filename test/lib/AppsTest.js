var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  Apps = require('../../lib/Apps')

require('colors')

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

  it('should install an application', function() {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = sinon.stub()
    boss.deployApplication.callsArg(5)

    apps.installApplication(url, name, options)

    expect(boss.disconnect.called).to.be.true
  })

  it('should relay stdout when installing an application', function(done) {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = function(name, url, user, info, error, complete) {
      info('foo')
      complete()
    }

    console.info = function(data) {
      expect(data).to.equal('foo')

      done()
    }

    apps.installApplication(url, name, options)
  })

  it('should relay stderr when installing an application', function(done) {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = function(name, url, user, info, error, complete) {
      error('foo')
      complete()
    }

    console.error = function(data) {
      expect(data).to.equal('foo')

      done()
    }

    apps.installApplication(url, name, options)
  })

  it('should fail to install application', function() {
    var name = 'name'
    var url = 'url'
    var options = {}
    boss.deployApplication = sinon.stub()
    apps._connect.callsArgWith(0, undefined, boss)

    boss.deployApplication.callsArgWith(5, new Error('urk!'))

    try {
      apps.installApplication(url, name, options)
    } catch(e) {
      if(e.message != 'urk!') throw e
    }
  })

  it('should list installed applications', function(done) {
    var options = {}
    var applications = [{
      name: 'foo',
      user: 'bar',
      url: 'baz'
    }]
    boss.listApplications = sinon.stub()
    boss.listApplications.callsArgWith(0, undefined, applications)

    var invocations = 1

    console.info = function(data) {
      if(invocations == 2) {
        // first invocation is table header..
        expect(data).to.contain('foo')

        done()
      }

      invocations++
    }

    apps.listApplications(options)
  })

  it('should fail to list installed applications', function() {
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

  it('should list application refs', function(done) {
    var app = 'foo'
    var options = {}
    var refs = [{
      name: 'bar',
      commit: 'baz'
    }]
    boss.listApplicationRefs = sinon.stub()
    boss.listApplicationRefs.withArgs(app, sinon.match.func).callsArgWith(1, undefined, refs)

    var invocations = 1

    console.info = function(data) {
      if(invocations == 2) {
        // first invocation is table header..
        expect(data).to.contain('bar')

        done()
      }

      invocations++
    }

    apps.listRefs(app, options)
  })

  it('should fail to list application refs', function() {
    var app = 'foo'
    var options = {}
    boss.listApplicationRefs = sinon.stub()
    boss.listApplicationRefs.withArgs(app, sinon.match.func).callsArgWith(1, new Error('urk!'))

    try {
      apps.listRefs(app, options)
    } catch(e) {
      if(e.message != 'urk!') throw e
    }
  })

  it('should update application refs', function(done) {
    var app = 'foo'
    var options = {}
    var refs = [{
      name: 'bar',
      commit: 'baz'
    }]
    boss.updateApplicationRefs = sinon.stub()
    boss.updateApplicationRefs.withArgs(app, sinon.match.func, sinon.match.func, sinon.match.func).callsArgWith(3, undefined, refs)

    var invocations = 1

    console.info = function(data) {
      if(invocations == 2) {
        // first invocation is table header..
        expect(data).to.contain('bar')

        done()
      }

      invocations++
    }

    apps.updateRefs(app, options)
  })

  it('should fail to update application refs', function() {
    var app = 'foo'
    var options = {}
    boss.updateApplicationRefs = sinon.stub()
    boss.updateApplicationRefs.withArgs(app, sinon.match.func, sinon.match.func, sinon.match.func).callsArgWith(3, new Error('urk!'))

    try {
      apps.updateRefs(app, options)
    } catch(e) {
      if(e.message != 'urk!') throw e
    }
  })
})
