var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  MessageResponder = require('../../../lib/boss/process/MessageResponder')

describe('MessageResponder', function() {
  var messageResponder

  beforeEach(function() {
    messageResponder = new MessageResponder()
    messageResponder._parentProcess = {
      on: sinon.stub(),
      send: sinon.stub()
    }
    messageResponder._usage = {
      lookup: sinon.stub()
    }
  })

  it('should respond to status request', function() {
    var cpu = 101
    messageResponder._usage.lookup.callsArgWith(2, null, {cpu: cpu})

    messageResponder.afterPropertiesSet()

    messageResponder._parentProcess.on.callCount.should.equal(1)
    messageResponder._parentProcess.on.getCall(0).args[0].should.equal('message')

    var messageHandler = messageResponder._parentProcess.on.getCall(0).args[1]
    messageHandler({type: 'boss:status'})

    messageResponder._parentProcess.send.callCount.should.equal(1)
    var event = messageResponder._parentProcess.send.getCall(0).args[0]

    event.type.should.equal('process:status')

    event.status.usage.cpu.should.equal(cpu)
  })

  it('should survive bad messages', function() {
    var cpu = 101
    messageResponder._usage.lookup.callsArgWith(2, null, {cpu: cpu})

    messageResponder.afterPropertiesSet()

    messageResponder._parentProcess.on.callCount.should.equal(1)
    messageResponder._parentProcess.on.getCall(0).args[0].should.equal('message')

    var messageHandler = messageResponder._parentProcess.on.getCall(0).args[1]
    messageHandler()

    messageResponder._parentProcess.send.callCount.should.equal(0)

    messageHandler('lol')

    messageResponder._parentProcess.send.callCount.should.equal(0)

    messageHandler({})

    messageResponder._parentProcess.send.callCount.should.equal(0)
  })
})
