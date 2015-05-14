var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('process-operations/launchd/create-process', function () {
  var fs
  var plist
  var createProcess

  beforeEach(function () {
    fs = {
      writeFile: sinon.stub()
    }
    plist = {
      build: sinon.stub()
    }
    createProcess = proxyquire('../../../../../lib/process-operations/launchd/create-process', {
      fs: fs,
      plist: plist
    })
  })

  it('should create plist', function (done) {
    var user = {
      group: {
        name: 'group',
        gid: 5
      }
    }
    var options = {
      args: []
    }

    fs.writeFile.callsArgWithAsync(3, null, user, options)

    createProcess(user, options, function (error, user, options) {
      done()
    })
  })
})
