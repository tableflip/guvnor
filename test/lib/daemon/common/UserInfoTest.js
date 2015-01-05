var sinon = require('sinon'),
  expect = require('chai').expect,
  path = require('path'),
  UserInfo = require('../../../../lib/daemon/common/UserInfo')

describe('UserInfo', function() {
  var userInfo

  beforeEach(function() {
    userInfo = new UserInfo()
    userInfo._posix = {
      getgrnam: sinon.stub(),
      getpwnam: sinon.stub()
    }
  })

  it('find uid/gid', function() {
    var groupName = 'foo'
    var gid = 10

    var userName = 'bar'
    var uid = 11

    userInfo._posix.getgrnam.withArgs(groupName).returns({
      gid: gid,
      name: groupName
    })
    userInfo._posix.getpwnam.withArgs(userName).returns({
      uid: uid,
      name: userName
    })

    process.env.BOSS_RUN_AS_GROUP = groupName
    process.env.BOSS_RUN_AS_USER = userName

    userInfo.afterPropertiesSet()

    expect(userInfo.getGid()).to.equal(gid)
    expect(userInfo.getGroupName()).to.equal(groupName)
    expect(userInfo.getUid()).to.equal(uid)
    expect(userInfo.getUserName()).to.equal(userName)
  })
})
