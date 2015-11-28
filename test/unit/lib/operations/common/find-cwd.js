var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('operations/common/find-cwd', function () {
  var fsStub
  var findCwd

  beforeEach(function () {
    fsStub = {}
    findCwd = proxyquire('../../../../../lib/operations/common/find-cwd', {
      'fs': fsStub
    })
  })

  it('should find cwd when script is a file', function (done) {
    var script = '/foo/bar.js'

    fsStub.stat = sinon.stub()
    fsStub.stat.withArgs('/foo/bar.js').callsArgWithAsync(1, null, {
      isDirectory: sinon.stub().returns(false)
    })
    fsStub.stat.withArgs('/foo').callsArgWithAsync(1, null, {
      isDirectory: sinon.stub().returns(true)
    })

    findCwd({}, {
      script: script
    }, function (error, user, options) {
      expect(error).to.not.exist
      expect(options.cwd).to.equal('/foo')
      done()
    })
  })

  it('should find cwd when script is a directory', function (done) {
    var script = '/foo/bar'

    fsStub.stat = sinon.stub().withArgs(script).callsArgWithAsync(1, null, {
      isDirectory: sinon.stub().returns(true)
    })

    findCwd({}, {
      script: script
    }, function (error, user, options) {
      expect(error).to.not.exist
      expect(options.cwd).to.equal('/foo/bar')
      done()
    })
  })

  it('should error when no cwd or script passed', function (done) {
    findCwd({}, {}, function (error) {
      expect(error).to.be.ok

      done()
    })
  })
})
