var expect = require('chai').expect,
  sinon = require('sinon'),
  Actions = require('../../../lib/cli/Actions')

describe('Actions', function () {
  var actions, guvnor, info, error, warn

  beforeEach(function () {
    info = console.info
    error = console.error
    warn = console.warn

    actions = new Actions()
    actions._config = {
      guvnor: {}
    }
    actions._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    actions._connectOrStart = sinon.stub()
    actions._user = {}
    actions._group = {}

    guvnor = {
      disconnect: sinon.stub(),
      on: sinon.stub(),
      findProcessInfoByPid: sinon.stub(),
      connectToProcess: sinon.stub()
    }

    actions._connectOrStart.callsArgWith(0, undefined, guvnor)
  })

  afterEach(function () {
    console.info = info
    console.error = error
    console.warn = warn
  })

  it('should parse start process options', function () {
    actions._user.name = 'user'
    actions._group.name = 'user'

    var options = actions._parseStartProcessOpts({})

    expect(options.user).to.equal(actions._user.name)
    expect(options.group).to.equal(actions._group.name)
    expect(options.instances).to.not.exist
    expect(options.name).to.not.exist
    expect(options.argv).to.not.exist
    expect(options.execArgv).to.not.exist
    expect(options.debug).to.not.exist
    expect(options.env).to.be.ok
  })

  it('should connect', function (done) {
    actions._do({}, function (bs) {
      expect(bs).to.equal(guvnor)

      done()
    })
  })

  it('should fail to connect', function () {
    actions._connectOrStart = sinon.stub()
    actions._connectOrStart.callsArgWith(0, new Error('urk!'))

    try {
      actions._do()
    } catch (error) {
      if (error.message != 'urk!')
        throw error
    }
  })

  it('should check for admin method', function (done) {
    guvnor.superAdminMethod = sinon.stub()

    actions._doAdmin('superAdminMethod', {}, function (bs) {
      expect(bs).to.equal(guvnor)

      done()
    })
  })

  it('should not find admin method', function () {
    actions._doAdmin('superAdminMethod', {})

    expect(actions._logger.warn.callCount).to.equal(1)
    expect(guvnor.disconnect.called).to.be.true
  })

  it('should log guvnor messages', function () {
    var guvnor = {
      on: sinon.stub()
    }

    actions._logMessages(guvnor)

    expect(guvnor.on.callCount).to.equal(1)
    expect(guvnor.on.getCall(0).args[0]).to.equal('*')

    expect(actions._logger.debug.called).to.be.false

    guvnor.on.getCall(0).args[1]('foo', 'bar')

    expect(actions._logger.debug.called).to.be.true
  })
})
