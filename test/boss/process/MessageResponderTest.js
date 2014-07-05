var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  MessageHandler = require('../../../lib/boss/process/MessageHandler')

describe('MessageHandler', function() {
  var messageHandler

  beforeEach(function() {
    messageHandler = new MessageHandler()
    messageHandler._parentProcess = {
      on: sinon.stub(),
      send: sinon.stub()
    }
    messageHandler._usage = {
      lookup: sinon.stub()
    }
  })

  it('should respond to status request', function() {
    var cpu = 101
    messageHandler._usage.lookup.callsArgWith(2, null, {cpu: cpu})

    messageHandler.afterPropertiesSet()

    messageHandler._parentProcess.on.callCount.should.equal(1)
    messageHandler._parentProcess.on.getCall(0).args[0].should.equal('message')

    var handler = messageHandler._parentProcess.on.getCall(0).args[1]
    handler({type: 'boss:status'})

    messageHandler._parentProcess.send.callCount.should.equal(1)
    var event = messageHandler._parentProcess.send.getCall(0).args[0]

    event.type.should.equal('process:status')

    event.status.usage.cpu.should.equal(cpu)
  })

  it('should survive bad messages', function() {
    var cpu = 101
    messageHandler._usage.lookup.callsArgWith(2, null, {cpu: cpu})

    messageHandler.afterPropertiesSet()

    messageHandler._parentProcess.on.callCount.should.equal(1)
    messageHandler._parentProcess.on.getCall(0).args[0].should.equal('message')

    var handler = messageHandler._parentProcess.on.getCall(0).args[1]
    handler()

    messageHandler._parentProcess.send.callCount.should.equal(0)

    handler('lol')

    messageHandler._parentProcess.send.callCount.should.equal(0)

    handler({})

    messageHandler._parentProcess.send.callCount.should.equal(0)
  })
})
