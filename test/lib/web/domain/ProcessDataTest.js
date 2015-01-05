var ProcessData = require('../../../../lib/web/domain/ProcessData'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('ProcessData', function() {
  var data

  beforeEach(function() {
    data = new ProcessData({
      'id': 0, 'pid': 0, 'name': '', 'script': '', 'uptime': 0, 'restarts': 0, 'status': '', 'memory': 0, 'cpu': 0
    })
    data._config = {}
    data._processDataFactory = {}
  })

  it('should accept existing log data', function() {
    expect(data.logs.length).to.equal(0)

    data = new ProcessData({
      'id': 0, 'pid': 0, 'name': '', 'script': '', 'uptime': 0, 'restarts': 0, 'status': '', 'memory': 0, 'cpu': 0,
      'logs': [{
        type: 'foo',
        date: Date.now(),
        message: 'bar'
      }]
    })
    data._config.logs = {
      max: 100
    }
    data.afterPropertiesSet()

    expect(data.logs.length).to.equal(1)
    expect(data.logs[0].type).to.equal('foo')
    expect(data.logs[0].message).to.equal('bar')
  })

  it('should not overflow log limit', function() {
    data.logs.length = 100
    expect(data.logs.length).to.equal(100)

    data._config.logs = {
      max: 100
    }

    data.log('foo', Date.now(), 'bar')

    // should not have increased overall length
    expect(data.logs.length).to.equal(100)

    // should have appended log
    expect(data.logs[99].type).to.equal('foo')
    expect(data.logs[99].message).to.equal('bar')
  })
})
