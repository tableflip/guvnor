var ProcessData = require('../../../../lib/web/domain/ProcessData'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('ProcessData', function () {
  var data

  beforeEach(function () {
    data = new ProcessData({
      'id': 0, 'pid': 0, 'name': '', 'script': '',
      'uptime': 0, 'restarts': 0, 'status': '',
      'memory': 0, 'cpu': 0
    })
    data._config = {
      graph: {
        max: 1000
      }
    }
    data._processDataFactory = {}
  })

  it('should accept existing log data', function () {
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

  it('should not overflow log limit', function () {
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

  it('should append usage information', function () {
    data.update({
      heapTotal: 123098230,
      heapUsed: 43098230,
      residentSize: 143098230,
      cpu: 98,
      latency: 12.3198123019823,
      time: 5
    })

    expect(data.usage.heapTotal.length).to.equal(1)
    expect(data.usage.heapUsed.length).to.equal(1)
    expect(data.usage.residentSize.length).to.equal(1)
    expect(data.usage.cpu.length).to.equal(1)
    expect(data.usage.latency.length).to.equal(1)

    expect(data.usage.heapTotal[0].x).to.equal(5)
    expect(data.usage.heapTotal[0].y).to.equal(123090000)
    expect(data.usage.heapUsed[0].x).to.equal(5)
    expect(data.usage.heapUsed[0].y).to.equal(43090000)
    expect(data.usage.residentSize[0].x).to.equal(5)
    expect(data.usage.residentSize[0].y).to.equal(143090000)
    expect(data.usage.cpu[0].x).to.equal(5)
    expect(data.usage.cpu[0].y).to.equal(98)
    expect(data.usage.latency[0].x).to.equal(5)
    expect(data.usage.latency[0].y).to.equal(12.32)
  })

  it('should append usage information for new workers', function () {
    var incoming = {
      workers: [{
        id: 'foo',
        pid: 1,
        heapTotal: 5,
        latency: 1
        }, {
        id: 'bar',
        pid: 1,
        heapTotal: 6,
        latency: 1
      }]
    }

    data._processDataFactory = {
      create: function (args, callback) {
        var proc = new ProcessData(args[0])
        proc._config = {
          graph: {
            max: 1000
          }
        }
        proc.afterPropertiesSet()

        callback(undefined, proc)
      }
    }

    data.update(incoming)

    expect(data.workers.length).to.equal(2)
    expect(data.workers[0].id).to.equal('foo')
    expect(data.workers[0].usage.heapTotal.length).to.equal(1)
    expect(data.workers[1].id).to.equal('bar')
    expect(data.workers[1].usage.heapTotal.length).to.equal(1)
  })

  it('should append usage information for existing workers', function () {
    var incoming = {
      workers: [{
        id: 'foo',
        pid: 1,
        heapTotal: 5,
        latency: 1
      }]
    }

    var proc = new ProcessData(incoming.workers[0])
    proc._config = {
      graph: {
        max: 1000
      }
    }
    proc.afterPropertiesSet()

    data.workers = [proc]

    data.update(incoming)

    expect(data.workers.length).to.equal(1)
    expect(data.workers[0].id).to.equal('foo')
    expect(data.workers[0].usage.heapTotal.length).to.equal(2)
  })

  it('should not overflow exception limit', function () {
    data.exceptions.length = 100
    expect(data.exceptions.length).to.equal(100)

    data._config.exceptions = {
      max: 100
    }

    data.exception(Date.now(), 'foo', 'bar', 'baz')

    // should not have increased overall length
    expect(data.exceptions.length).to.equal(100)

    // should have appended exception
    expect(data.exceptions[99].message).to.equal('foo')
    expect(data.exceptions[99].code).to.equal('bar')
    expect(data.exceptions[99].stack).to.equal('baz')
  })
})
