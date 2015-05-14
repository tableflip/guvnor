var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var expect = require('chai').expect
var sinon = require('sinon')
var yargsStub = require('../yargs-stub')
var add = require('../../../../../lib/cli/user/add')

describe('cli/user/add', function () {
  var api
  var user
  var info
  var yargs

  beforeEach(function () {
    api = {
      user: {
        add: sinon.stub()
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
    api.user.add.callsArgWith(1, new Error('Urk!'))

    expect(add.bind(null, user, api, yargs)).to.throw
  })

  it('should print a message when a user is added', function () {
    api.user.add.withArgs('foo', sinon.match.func).callsArg(1)

    yargs.argv._ = ['node', 'guv', 'add', 'foo']

    add(user, api, yargs)

    expect(console.info.getCall(0).args[0]).to.equal('User %s added')
    expect(console.info.getCall(0).args[1]).to.equal('foo')
    expect(api.disconnect.called).to.be.true
  })
})
