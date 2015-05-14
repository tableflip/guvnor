var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var processNameFromScript = require('../../../../lib/common/process-name-from-script')

describe('common/process-name-from-script', function () {

  it('should convert name', function () {
    var script = '/foo/bar/baz.js'
    var processName = 'baz.js'

    expect(processNameFromScript(script)).to.equal(processName)
  })

  it('should convert name with upper case', function () {
    var script = '/foo/bar/baZ.js'
    var processName = 'baz.js'

    expect(processNameFromScript(script)).to.equal(processName)
  })

  it('should remove non-word characters', function () {
    var script = '/foo/bar/hello-world.js'
    var processName = 'hello-world.js'

    expect(processNameFromScript(script)).to.equal(processName)
  })
})
