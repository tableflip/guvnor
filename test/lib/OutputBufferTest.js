var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  OutputBuffer = require('../../lib/OutputBuffer')

require('colors')

describe('OutputBuffer', function() {

  it('should buffer output', function() {
    var output = sinon.stub()

    var buffer = new OutputBuffer(output)
    buffer.append('foo')
    buffer.append('foo')
    buffer.append('fo\no')
    buffer.append('foo')
    buffer.flush()

    expect(output.callCount).to.equal(2)
    expect(output.getCall(0).args[0]).to.equal('foofoofo')
    expect(output.getCall(1).args[0]).to.equal('ofoo')
  })
})
