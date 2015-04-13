var expect = require('chai').expect,
  sinon = require('sinon'),
  ManagedApp = require('../../../lib/common/ManagedApp'),
  EventEmitter = require('events').EventEmitter

describe('ManagedApp', function () {
  var app, daemon

  beforeEach(function () {
    daemon = {
      switchApplicationRef: sinon.stub(),
      listApplicationRefs: sinon.stub(),
      updateApplicationRefs: sinon.stub(),
      currentRef: sinon.stub()
    }

    app = new ManagedApp({}, daemon)
  })

  it('should proxy daemon methos', function () {
    expect(daemon.switchApplicationRef.called).to.be.false
    app.switchRef()
    expect(daemon.switchApplicationRef.called).to.be.true

    expect(daemon.listApplicationRefs.called).to.be.false
    app.listRefs()
    expect(daemon.listApplicationRefs.called).to.be.true

    expect(daemon.updateApplicationRefs.called).to.be.false
    app.updateRefs()
    expect(daemon.updateApplicationRefs.called).to.be.true

    expect(daemon.currentRef.called).to.be.false
    app.currentRef()
    expect(daemon.currentRef.called).to.be.true
  })

  it('should update details', function () {
    expect(app.foo).to.not.exist

    app.update({
      foo: 'bar'
    })

    expect(app.foo).to.equal('bar')
  })

  it('should survive updating details with null', function () {
    app.update(null)
  })
})
