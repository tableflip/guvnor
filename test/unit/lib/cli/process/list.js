var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var expect = require('chai').expect
var sinon = require('sinon')
var yargsStub = require('../yargs-stub')
var list = require('../../../../../lib/cli/process/list')

describe('cli/process/list', function () {
  var api
  var user
  var info
  var yargs

  beforeEach(function () {
    api = {
      process: {
        list: sinon.stub()
      },
      disconnect: sinon.stub()
    }
    user = {}
    yargs = yargsStub()
    info = console.info
    console.info = sinon.stub()
  })

  afterEach(function () {
    console.info = info
  })

  it('should throw an error if an error is passed', function () {
    api.process.list.callsArgWith(0, new Error('Urk!'))

    expect(list.bind(null, user, api, yargs)).to.throw
  })

  it('should print a message when the process list is empty', function () {
    api.process.list.callsArgWith(0, null, [])

    list(user, api, yargs)

    expect(console.info.getCall(0).args[0]).to.contain('No running processes')
    expect(api.disconnect.called).to.be.true
  })

  it('should output JSON', function () {
    api.process.list.callsArgWith(0, null, [{
      name: 'proc1'
    }, {
      name: 'proc2'
    }])

    yargs.argv.json = true

    list(user, api, yargs)

    var output = console.info.getCall(0).args[0]

    var result = JSON.parse(output)

    expect(result[0].name).to.equal('proc1')
    expect(result[1].name).to.equal('proc2')
    expect(api.disconnect.called).to.be.true
  })

  it('should print a table of processes', function () {
    api.process.list.callsArgWith(0, null, [{
      name: 'proc1',
      pid: 'proc1-pid'
    }])

    list(user, api, yargs)

    expect(console.info.getCall(0).args[0]).to.contain('PID')
    expect(console.info.getCall(1).args[0]).to.contain('proc1-pid')
    expect(api.disconnect.called).to.be.true
  })

  it('should print a table of clustered processes', function () {
    api.process.list.callsArgWith(0, null, [{
      name: 'proc1',
      pid: 'proc1-pid',
      workers: [{
        name: 'proc1-worker'
      }]
    }])

    list(user, api, yargs)

    expect(console.info.getCall(0).args[0]).to.contain('PID')
    expect(console.info.getCall(1).args[0]).to.contain('Manager')
    expect(console.info.getCall(2).args[0]).to.contain('Worker')
    expect(api.disconnect.called).to.be.true
  })
})
