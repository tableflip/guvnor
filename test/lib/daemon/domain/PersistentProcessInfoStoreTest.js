var expect = require('chai').expect
var sinon = require('sinon')
var PersistentProcessInfoStore = require('../../../../lib/daemon/domain/PersistentProcessInfoStore')

describe('PersistentProcessInfoStore', function () {
  var store

  beforeEach(function() {
    store = new PersistentProcessInfoStore()
    store._jsonfile = {
      writeFile: sinon.stub(),
      writeFileSync: sinon.stub()
    }
  })

  it('should pass objects through remover function when saving', function (done) {
    store._store = [{}]
    store._jsonfile.writeFile.callsArgAsync(3)
    store._removeRuntimeProperties = sinon.stub().returnsArg(0)

    store.save(function () {
      expect(store._removeRuntimeProperties.called).to.be.true

      done()
    })
  })

  it('should pass objects through remover function when saving synchronously', function () {
    store._store = [{}]
    store._removeRuntimeProperties = sinon.stub().returnsArg(0)

    store.saveSync()

    expect(store._removeRuntimeProperties.called).to.be.true
  })

  it('should not include default fields in simple object', function () {
    var processInfo = {
      script: 'test.js',
      user: 'foo',
      env: {
        NOT_IN_ENV: 'hello',
        IN_ENV: 'world'
      },
      argv: [],
      execArgv: []
    }
    processInfo.toJSON = function() {
      return this
    }

    var simple = store._removeRuntimeProperties(processInfo)

    // there are a few fields we don't want written out to disk
    expect(simple.id).not.to.exist
    expect(simple.pid).not.to.exist
    expect(simple.debugPort).not.to.exist
    expect(simple.restarts).not.to.exist
    expect(simple.totalRestarts).not.to.exist
    expect(simple.status).not.to.exist
    expect(simple.socket).not.to.exist
    expect(simple.debug).not.to.exist
    expect(simple.cluster).not.to.exist
    expect(simple.instances).not.to.exist
    expect(simple.cwd).not.to.exist
    expect(simple.argv).not.to.exist
    expect(simple.execArgv).not.to.exist
    expect(simple.restartOnError).not.to.exist
    expect(simple.restartRetries).not.to.exist
    expect(simple.crashRecoveryPeriod).not.to.exist
    expect(simple.name).not.to.exist
    expect(simple.env.NOT_IN_ENV).to.equal('hello')
    //expect(simple.env.IN_ENV).not.to.exist
  })
})
