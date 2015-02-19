var sinon = require('sinon'),
  expect = require('chai').expect,
  ConfigLoader = require('../../../../lib/daemon/common/ConfigLoader')

describe('ConfigLoader', function() {
  it('should invoke afterPropertiesSet callback when config has been sent', function(done) {
    var configLoader = new ConfigLoader()
    configLoader._parentProcess = {
      once: sinon.stub(),
      send: sinon.stub()
    }
    configLoader._coercer = sinon.stub()

    configLoader._coercer.returnsArg(0)

    configLoader.afterPropertiesSet(function() {
      // should have applied config options
      expect(configLoader.foo).to.equal('bar')

      // but not ones prefixed with underscores
      expect(configLoader._foo).to.not.exist

      done()
    })

    process.nextTick(function() {
      // should have asked parent process for config
      expect(configLoader._parentProcess.send.callCount).to.equal(1)
      expect(configLoader._parentProcess.send.getCall(0).args[0]).to.equal('process:config:request')

      // should have set up listener for config response
      expect(configLoader._parentProcess.once.callCount).to.equal(1)
      expect(configLoader._parentProcess.once.getCall(0).args[0]).to.equal('daemon:config:response')

      // invoke config response listener
      var callback = configLoader._parentProcess.once.getCall(0).args[1]

      callback({
        foo: 'bar',
        _foo: 'bar'
      })
    })
  })
})
