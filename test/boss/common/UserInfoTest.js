var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  UserInfo = require('../../../lib/boss/common/UserInfo')

describe('UserInfo', function() {
  var userInfo

  beforeEach(function() {
    userInfo = new UserInfo()
    userInfo._posix = {
      getgrnam: sinon.stub(),
      getpwnam: sinon.stub()
    }
  })

  it('find user/groups as strings', function() {
    var groupName = 'foo'
    var gid = 10

    var userName = 'bar'
    var uid = 11

    userInfo._posix.getgrnam.withArgs(groupName).returns({
      name: groupName,
      gid: gid
    })
    userInfo._posix.getpwnam.withArgs(userName).returns({
      name: userName,
      uid: uid
    })

    process.env.BOSS_RUN_AS_GROUP = groupName
    process.env.BOSS_RUN_AS_USER = userName

    userInfo.afterPropertiesSet()

    userInfo.getGid().should.equal(gid)
    userInfo.getGroupName().should.equal(groupName)
    userInfo.getUid().should.equal(uid)
    userInfo.getUserName().should.equal(userName)
  })

  it('find user/groups as ids', function() {
    var groupName = 'foo'
    var gid = 10

    var userName = 'bar'
    var uid = 11

    userInfo._posix.getgrnam.withArgs(gid).returns({
      name: groupName,
      gid: gid
    })
    userInfo._posix.getpwnam.withArgs(uid).returns({
      name: userName,
      uid: uid
    })

    process.env.BOSS_RUN_AS_GROUP = gid
    process.env.BOSS_RUN_AS_USER = uid

    userInfo.afterPropertiesSet()

    userInfo.getGid().should.equal(gid)
    userInfo.getGroupName().should.equal(groupName)
    userInfo.getUid().should.equal(uid)
    userInfo.getUserName().should.equal(userName)
  })

  it('find user/groups as ids stored as strings', function() {
    var groupName = 'foo'
    var gid = 10

    var userName = 'bar'
    var uid = 11

    userInfo._posix.getgrnam.withArgs(gid).returns({
      name: groupName,
      gid: gid
    })
    userInfo._posix.getpwnam.withArgs(uid).returns({
      name: userName,
      uid: uid
    })

    process.env.BOSS_RUN_AS_GROUP = gid.toString()
    process.env.BOSS_RUN_AS_USER = uid.toString()

    userInfo.afterPropertiesSet()

    userInfo.getGid().should.equal(gid)
    userInfo.getGroupName().should.equal(groupName)
    userInfo.getUid().should.equal(uid)
    userInfo.getUserName().should.equal(userName)
  })
})
