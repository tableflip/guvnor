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
      create: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }
  })

  it('should deploy a project', function() {

  })
})
