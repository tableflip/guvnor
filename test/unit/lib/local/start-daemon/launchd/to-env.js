
var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var toEnv = require('../../../../../../lib/local/start-daemon/launchd/to-env.js')

describe('local/start-daemon/launchd/to-env', function () {

  it('should transform object to env vars', function () {
    var config = {
      foo: 'bar',
      baz: {
        qux: 'quux',
        fred: 1,
        waldo: true
      }
    }

    var env = toEnv(config)

    expect(env.FOO).to.equal('bar')
    expect(env.BAZ_QUX).to.equal('quux')
    expect(env.BAZ_FRED).to.equal(1)
    expect(env.BAZ_WALDO).to.equal(true)
  })
})
