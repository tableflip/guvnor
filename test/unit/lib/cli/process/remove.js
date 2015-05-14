var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var expect = require('chai').expect
var sinon = require('sinon')
var yargsStub = require('../yargs-stub')
var remove = require('../../../../../lib/cli/process/remove')

describe('cli/process/remove', function () {
  var api
  var user
  var info
  var yargs

  beforeEach(function () {
    api = {
      process: {
        remove: sinon.stub()
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
    api.process.remove.callsArgWith(1, new Error('Urk!'))

    expect(remove.bind(null, user, api, yargs)).to.throw
  })

  it('should print a message when the process is removed', function () {
    api.process.remove.callsArg(1)

    yargs.argv._ = ['node', 'guv', 'remove', 'foo']

    remove(user, api, yargs)

    expect(console.info.getCall(0).args[0]).to.equal('Process %s removed')
    expect(console.info.getCall(0).args[1]).to.equal('foo')
    expect(api.disconnect.called).to.be.true
  })
})
