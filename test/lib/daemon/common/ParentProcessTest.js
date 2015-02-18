var expect = require('chai').expect,
  path = require('path'),
  ParentProcess = require('../../../../lib/daemon/common/ParentProcess')

describe('ParentProcess', function() {

  it('should remote private fields from objects', function() {
    var parentProcess = new ParentProcess()

    var output = parentProcess._remotePrivateFieldsFromObject({
      _foo: 'bar',
      baz: 'qux'
    })

    expect(output.baz).to.equal('qux')
    expect(output._foo).to.not.exist
  })

  it('should remote private fields from objects with array properties', function() {
    var parentProcess = new ParentProcess()

    var output = parentProcess._remotePrivateFieldsFromObject({
      baz: [{
        _foo: 'bar',
        baz: 'qux',
        garply: 1,
        corge: true,
        grault: false,
        waldo: {
          fred: undefined,
          plugh: null,
          xyzzy: new String("thud")
        }
      }]
    })

    expect(output.baz[0]._foo).to.not.exist
    expect(output.baz[0].baz).to.equal('qux')
    expect(output.baz[0].garply).to.equal(1)
    expect(output.baz[0].corge).to.equal(true)
    expect(output.baz[0].grault).to.equal(false)
    expect(output.baz[0].waldo.fred).to.equal(undefined)
    expect(output.baz[0].waldo.plugh).to.equal(null)
    expect(output.baz[0].waldo.xyzzy.toString()).to.equal("thud")
  })

  it('should send a message', function() {
    process.send = sinon.stub()

    var parentProcess = new ParentProcess()
    parentProcess.send('process:foo', 'bar')

    expect(process.send.called).to.be.true
    expect(process.send.getCall(0).args[0].type).to.equal('process:foo')
    expect(process.send.getCall(0).args[0].args).to.deep.equal(['bar'])
  })

  it('should emit a message', function(done) {
    process.send = sinon.stub()

    // sets up handlers for messages
    var parent = new ParentProcess()

    parent.on('foo:bar', function(arg1, arg2) {
      expect(arg1).to.equal('baz')
      expect(arg2).to.equal('qux')

      done()
    })

    process.emit('message', {
      type: 'foo:bar',
      args: ['baz', 'qux']
    })
  })
})
