var HostData = require('../../../../lib/web/domain/HostData'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('HostData', function() {
  var data

  beforeEach(function() {
    data = new HostData('test', {})
    data._config = {}
    data._processDataFactory = {}
    data._webSocketResponder = {}
  })

  it('should remove missing processes', function() {
    data.processes.push({
      id: 'foo'
    })
    data.processes.push({
      id: 'bar'
    })

    expect(data.processes.length).to.equal(2)

    data._removeMissingProcesses([{
      id: 'foo'
    }])

    expect(data.processes.length).to.equal(1)
    expect(data.processes[0].id).to.equal('foo')
  })

  it('should find process by id', function() {
    data.processes.push({
      id: 'foo'
    })
    data.processes.push({
      id: 'bar'
    })

    var returned = data.findProcessById('bar')

    expect(returned.id).to.equal('bar')
  })

  it('should fail to find process by id', function() {
    data.processes.push({
      id: 'foo'
    })
    data.processes.push({
      id: 'bar'
    })

    var returned = data.findProcessById('baz')

    expect(returned).to.not.exist
  })
})
