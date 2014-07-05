var stubs = {
  child_process: {},
  dnode: {}
}

var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  proxyquire = require('proxyquire'),
  DaemonStarter = proxyquire(path.resolve(__dirname, '../lib/cli/DaemonStarter'), stubs)

var daemonStarter = new DaemonStarter()
daemonStarter._logger = {
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub()
}

describe('DaemonStarter', function() {
  describe('_startDaemon', function() {
    it('should start the process starter daemon', function(done) {
      var starter = {
        once: sinon.stub(),
        unref: sinon.stub()
      }

      stubs.child_process.fork = function(module) {
        should(module).not.be.null

        return starter
      }

      daemonStarter.on('ready', done)

      var remote = {
        on: sinon.stub(),
        once: sinon.stub(),
        getApiMethods: sinon.stub()
      }

      stubs.dnode.connect = function() {
        return remote
      }

      // the method under test
      daemonStarter._startDaemon()

      starter.unref.callCount.should.equal(1)

      // invoke the callback
      starter.once.callCount.should.equal(1)
      starter.once.getCall(0).args[0].should.equal('message')
      starter.once.getCall(0).args[1]({type: 'daemon:ready'})

      remote.getApiMethods.callsArgWith(0, [])

      remote.once.callCount.should.equal(1)
      remote.once.getCall(0).args[0].should.equal('remote')
      remote.once.getCall(0).args[1](remote)
    })

    it('should kill the daemon if an error is reported', function(done) {
      var starter = {
        once: sinon.stub(),
        unref: sinon.stub(),
        kill: sinon.stub()
      }

      stubs.child_process.fork = function(module) {
        should(module).not.be.null

        return starter
      }

      // the method under test
      daemonStarter._startDaemon()

      starter.unref.callCount.should.equal(1)

      // invoke the callback
      starter.once.callCount.should.equal(1)
      starter.once.getCall(0).args[0].should.equal('message')

      try {
        starter.once.getCall(0).args[1]({type: 'daemon:fatality'})
      } catch(e) {

      }

      starter.kill.callCount.should.equal(1)

      done()
    })
  })
})
