var test = require('ava')
var sinon = require('sinon')
var yargsStub = require('../yargs-stub')
var list = require('../../../../../lib/cli/process/list')

test.beforeEach('cli/process/list beforeEach', t => {
  t.context.api = {
    process: {
      list: sinon.stub()
    },
    disconnect: sinon.stub()
  }
  t.context.user = {}
  t.context.yargs = yargsStub()
  t.context.info = console.info

  console.info = sinon.stub()
})

test.afterEach('cli/process/list afterEach', t => {
  console.info = t.context.info
})

test('should throw an error if an error is passed', t => {
  t.context.api.process.list.callsArgWith(0, new Error('Urk!'))
  t.throws(list.bind(null, t.context.user, t.context.api, t.context.yargs))
})

test('should print a message when the process list is empty', t => {
  t.context.api.process.list.callsArgWith(0, null, [])

  list(t.context.user, t.context.api, t.context.yargs)

  t.ok(console.info.getCall(0).args[0].includes('No running processes'))
  t.ok(t.context.api.disconnect.called)
})

test('should output JSON', t => {
  t.context.api.process.list.callsArgWith(0, null, [{
    name: 'proc1'
  }, {
    name: 'proc2'
  }])

  t.context.yargs.argv.json = true

  list(t.context.user, t.context.api, t.context.yargs)

  var output = console.info.getCall(0).args[0]

  try {
    var result = JSON.parse(output)

    t.equal(result[0].name, 'proc1')
    t.equal(result[1].name, 'proc2')
    t.ok(api.disconnect.called)
  } catch (e) {
    t.fail('Could not parse ' + output + ' ' + e)
  }

})

test('should print a table of processes', t => {
  t.context.api.process.list.callsArgWith(0, null, [{
    name: 'proc1',
    pid: 'proc1-pid'
  }])

  list(t.context.user, t.context.api, t.context.yargs)

  t.ok(console.info.getCall(0).args[0].includes('PID'))
  t.ok(console.info.getCall(1).args[0].includes('proc1-pid'))
  t.ok(t.context.api.disconnect.called)
})

test('should print a table of clustered processes', t => {
  t.context.api.process.list.callsArgWith(0, null, [{
    name: 'proc1',
    pid: 'proc1-pid',
    workers: [{
      name: 'proc1-worker'
    }]
  }])

  list(t.context.user, t.context.api, t.context.yargs)

  t.ok(console.info.getCall(0).args[0].includes('PID'))
  t.ok(console.info.getCall(1).args[0].includes('Manager'))
  t.ok(console.info.getCall(2).args[0].includes('Worker'))
  t.ok(t.context.api.disconnect.called)
})

/*
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
*/
