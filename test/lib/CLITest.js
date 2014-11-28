var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  CLI = require('../../lib/CLI')

describe('CLI', function() {
  var cli

  beforeEach(function() {
    cli = new CLI()
    cli._config = {
      boss: {

      }
    }
    cli._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    cli._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    cli._user = {

    }
    cli._commander = {
      version: sinon.stub(),
      command: sinon.stub(),
      parse: sinon.stub()
    }
  })

  it('should parse list of arguments', function() {
    var list = cli._parseList('--foo')
    expect(list).to.contain('--foo')
  })

  it('should parse list of arguments with multiple arguments', function() {
    var list = cli._parseList('--foo --bar')
    expect(list).to.contain('--foo')
    expect(list).to.contain('--bar')
  })

  it('should parse list of short arguments with multiple arguments', function() {
    var list = cli._parseList('-f 1 -b 2')
    expect(list).to.contain('-f')
    expect(list).to.contain('1')
    expect(list).to.contain('-b')
    expect(list).to.contain('2')
  })

  it('should print a warning if the user is in the wrong group', function() {
    var userName = 'foo'
    cli._user.name = userName
    var bossGroup = 'bar'
    var groupsEntry = {
      members: ['baz']
    }

    cli._config.boss.group = bossGroup
    cli._posix.getgrnam.withArgs(bossGroup).returns(groupsEntry)

    expect(cli._logger.warn.called).to.be.false

    cli._checkUserPermissions()

    expect(cli._logger.warn.called).to.be.true
  })

  it('should be slient if the user is in the right group', function() {
    var userName = 'foo'
    cli._user.name = userName
    var bossGroup = 'bar'
    var groupsEntry = {
      members: [userName]
    }

    cli._config.boss.group = bossGroup
    cli._posix.getgrnam.withArgs(bossGroup).returns(groupsEntry)

    expect(cli._logger.warn.called).to.be.false

    cli._checkUserPermissions()

    expect(cli._logger.warn.called).to.be.false
  })
})
