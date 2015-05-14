var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var expect = require('chai').expect
var sinon = require('sinon')
var yargsStub = require('../yargs-stub')
var start = require('../../../../../lib/cli/process/start')

describe('cli/process/start', function () {
  var api
  var user
  var info
  var yargs

  beforeEach(function () {
    api = {
      process: {
        start: sinon.stub()
      },
      disconnect: sinon.stub()
    }
    user = {}
    info = console.info
    console.info = sinon.stub()
    yargs = yargsStub()
  })

  afterEach(function () {
    console.info = info
  })

  it('should throw an error if an error is passed', function () {
    api.process.start.callsArgWith(2, new Error('Urk!'))

    expect(start.bind(null, user, api, yargs)).to.throw
  })

  it('should print a message when the process is started', function () {
    api.process.start.callsArgWith(2, null, {
      name: 'foo'
    })

    yargs.argv._ = ['node', 'guv', 'start', 'foo.js']
    yargs.argv.group = 'group'

    start(user, api, yargs)

    expect(console.info.getCall(0).args[0]).to.equal('Process %s started')
    expect(console.info.getCall(0).args[1]).to.equal('foo')
    expect(api.disconnect.called).to.be.true
  })
})
