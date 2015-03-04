var sinon = require('sinon'),
  expect = require('chai').expect,
  LatencyMonitor = require('../../../../lib/daemon/common/LatencyMonitor')

describe('LatencyMonitor', function () {
  var monitor, lag

  beforeEach(function () {
    lag = sinon.stub()

    monitor = new LatencyMonitor()
    monitor._lag = sinon.stub()

    monitor._lag.withArgs(1000).returns(lag)

    monitor.afterPropertiesSet()
  })

  it('should report latency', function () {
    var latency = 5

    lag.returns(latency)

    expect(monitor.latency).to.equal(latency)
  })

  it('should correct spurious latency', function () {
    var latency = -10

    lag.returns(latency)

    expect(monitor.latency).to.equal(0)
  })
})
