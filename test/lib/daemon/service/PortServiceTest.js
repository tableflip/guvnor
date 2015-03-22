var expect = require('chai').expect,
  sinon = require('sinon'),
  EventEmitter = require('events').EventEmitter,
  PortService = require('../../../../lib/daemon/service/PortService')

describe('PortService', function () {
  var service

  beforeEach(function () {
    service = new PortService()
    service._config = {}
    service._net = {
      createServer: sinon.stub()
    }
  })

  it('should find a random port', function (done) {
    service.afterPropertiesSet()

    var port = 5
    var server = new EventEmitter()
    server.address = sinon.stub().returns({
      port: port
    })
    server.listen = function (port, address) {
      expect(port).to.equal(0)
      expect(address).to.equal('127.0.0.1')

      server.emit('listening')
    }
    server.close = function () {
      server.emit('close')
    }
    service._net.createServer.returns(server)

    service.freePort(function (error, p) {
      expect(error).to.not.exist
      expect(p).to.equal(port)

      done()
    })
  })

  it('should select a port from a pool', function (done) {
    service._config.ports = {
      start: 10,
      end: 20
    }
    service.afterPropertiesSet()

    var server = new EventEmitter()
    server.address = sinon.stub().returns({
      port: service._config.ports.start
    })
    server.listen = function (port, address) {
      expect(port).to.equal(service._config.ports.start)
      expect(address).to.equal('127.0.0.1')

      server.emit('listening')
    }
    server.close = function () {
      server.emit('close')
    }
    service._net.createServer.returns(server)

    service.freePort(function (error, port) {
      expect(error).to.not.exist
      expect(port).to.equal(service._config.ports.start)

      done()
    })
  })

  it('should return to the start of the pool', function (done) {
    service._config.ports = {
      start: 10,
      end: 20
    }
    service.afterPropertiesSet()
    service._nextPort = service._config.ports.end

    var server = new EventEmitter()
    server.address = sinon.stub().returns({
      port: service._config.ports.end
    })
    server.listen = function (port, address) {
      expect(port).to.equal(service._config.ports.end)
      expect(address).to.equal('127.0.0.1')

      server.emit('listening')
    }
    server.close = function () {
      server.emit('close')
    }
    service._net.createServer.returns(server)

    service.freePort(function (error, port) {
      expect(error).to.not.exist
      expect(port).to.equal(service._config.ports.end)
      expect(service._nextPort).to.equal(service._config.ports.start)

      done()
    })
  })
})
