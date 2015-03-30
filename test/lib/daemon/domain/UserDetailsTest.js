var expect = require('chai').expect
var sinon = require('sinon')
var UserDetails = require('../../../../lib/daemon/domain/UserDetails')

describe('UserDetails', function () {
  var userDetails

  beforeEach(function() {
    userDetails = new UserDetails('foo')
    userDetails._posix = {
      getpwnam: sinon.stub()
    }
    userDetails._child_process = {
      execFile: sinon.stub()
    }
  })

  it('should get path from sudo', function (done) {
    var path = 'path'
    var user = {
      uid: 'uid',
      gid: 'gid',
      dir: 'dir',
      name: 'name',
      shell: 'shell'
    }
    userDetails._posix.getpwnam.withArgs(userDetails._id).returns(user)
    userDetails._child_process.execFile.withArgs('sudo', ['-u', user.name, 'printenv', 'PATH']).callsArgWith(3, undefined, [path])
    userDetails._child_process.execFile.withArgs('sudo', ['-u', user.name, 'groups']).callsArgWith(3, undefined, ['foo bar'])

    userDetails.afterPropertiesSet(function() {
      expect(userDetails._id).to.not.exist
      expect(userDetails.gid).to.equal(user.gid)
      expect(userDetails.uid).to.equal(user.uid)
      expect(userDetails.home).to.equal(user.dir)
      expect(userDetails.name).to.equal(user.name)
      expect(userDetails.shell).to.equal(user.shell)
      expect(userDetails.path).to.equal(path)
      expect(userDetails.groups).to.deep.equal(['foo', 'bar'])

      done()
    })
  })

  it('should pass error to callback when sudo fails', function (done) {
    var error = new Error('urk!')
    var user = {
      uid: 'uid',
      gid: 'gid',
      dir: 'dir',
      name: 'name',
      shell: 'shell'
    }
    userDetails._posix.getpwnam.withArgs(userDetails._id).returns(user)
    userDetails._child_process.execFile.withArgs('sudo').callsArgWith(3, error)

    userDetails.afterPropertiesSet(function(er) {
      expect(er).to.equal(error)

      done()
    })
  })
})
