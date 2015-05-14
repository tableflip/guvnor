var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('process-operations/common/load-options', function () {
  var fsStub
  var loadOptions

  beforeEach(function () {
    fsStub = {}
    loadOptions = proxyquire('../../../../../lib/process-operations/common/load-options', {
      'fs': fsStub
    })
  })

  it('should load options', function (done) {
    var userOptions = {
      env: {
        foo: 'bar'
      },
      cwd: 'baz'
    }

    var options = {
      env: {
        fred: 'waldo'
      },
      cwd: '/qux'
    }

    fsStub.exists = sinon.stub().withArgs('/qux/guvnor.rc').callsArgWith(1, true)
    fsStub.readFile = sinon.stub().withArgs('/qux/guvnor.rc').callsArgWith(1, null, JSON.stringify(userOptions))

    loadOptions({}, options, function (error, user, mergedOptions) {
      expect(error).to.not.exist
      expect(mergedOptions.cwd).to.equal(options.cwd)
      expect(mergedOptions.env.foo).to.equal(userOptions.env.foo)
      expect(mergedOptions.env.fred).to.equal(options.env.fred)

      done()
    })
  })

  it('should return original options if no file found', function (done) {
    var options = {
      env: {
        fred: 'waldo'
      },
      cwd: '/qux'
    }

    fsStub.exists = sinon.stub().withArgs('/qux/guvnor.rc').callsArgWith(1, true)
    fsStub.readFile = sinon.stub().withArgs('/qux/guvnor.rc').callsArgWith(1, new Error('urk!'))

    loadOptions({}, options, function (error, user, mergedOptions) {
      expect(error).to.not.exist
      expect(mergedOptions).to.deep.equal(options)

      done()
    })
  })
})
