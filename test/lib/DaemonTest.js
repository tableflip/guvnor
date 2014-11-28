var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  Daemon = require('../../lib/Daemon')

describe('Daemon', function() {
  var daemon

  beforeEach(function() {
    daemon = new Daemon()
    daemon._config = {
      boss: {

      }
    }
    daemon._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    daemon._connect = sinon.stub()
    daemon._running = sinon.stub()
  })

  it('should return config option', function(done) {
    daemon._config = {
      foo: 'bar'
    }

    console.info = function(result) {
      expect(result).to.equal('bar')

      done()
    }

    daemon.config('foo')
  })

  it('should return nested config option', function(done) {
    daemon._config = {
      bar: {
        baz: 'foo'
      }
    }

    console.info = function(result) {
      expect(result).to.equal('foo')

      done()
    }

    daemon.config('bar.baz')
  })

  it('should be able to find out if boss is running', function(done) {
    console.info = function(result) {
      expect(result).to.contain('is running')

      done()
    }

    daemon._running.callsArgWith(0, true)

    daemon.status()
  })

  it('should be able to find out if boss is not running', function(done) {
    console.info = function(result) {
      expect(result).to.contain('is not running')

      done()
    }

    daemon._running.callsArgWith(0, false)

    daemon.status()
  })
})
