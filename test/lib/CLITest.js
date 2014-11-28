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
      getgrnam: sinon.stub()
    }
    cli._user = {

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

  it('should return config option', function(done) {
    var config = {
      foo: 'bar'
    }

    console.info = function(result) {
      expect(result).to.equal('bar')

      done()
    }

    cli._config = config

    cli.config('foo')
  })

  it('should return nested config option', function(done) {
    var config = {
      bar: {
        baz: 'foo'
      }
    }

    console.info = function(result) {
      expect(result).to.equal('foo')

      done()
    }

    cli._config = config

    cli.config('bar.baz')
  })

  it('should be able to find out if boss is running', function(done) {
    cli._running = sinon.stub()

    console.info = function(result) {
      expect(result).to.contain('is running')

      done()
    }

    cli._running.callsArgWith(0, true)

    cli.status()
  })

  it('should be able to find out if boss is not running', function(done) {
    cli._running = sinon.stub()

    console.info = function(result) {
      expect(result).to.contain('is not running')

      done()
    }

    cli._running.callsArgWith(0, false)

    cli.status()
  })
})
