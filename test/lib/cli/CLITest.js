var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  CLI = require('../../../lib/cli/CLI')

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
    cli._os = {
      platform: sinon.stub()
    }
    cli._prompt = {
      start: sinon.stub(),
      get: sinon.stub()
    }
    cli._execSync = {
      exec: sinon.stub(),
      run: sinon.stub()
    }
    cli._child_process = {
      exec: sinon.stub()
    }
    cli._fs = {
      appendFile: sinon.stub()
    }
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
    cli._os.platform.returns('linux')

    expect(cli._logger.error.called).to.be.false

    cli._checkBossUser(function(error) {
      expect(error).to.be.ok
    })

    expect(cli._logger.error.called).to.be.true
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

    cli._checkBossUser()

    expect(cli._logger.warn.called).to.be.false
  })

  it('should create a group on Linux', function(done) {
    var groupadd = 'foo'
    var code = 0

    cli._config.boss.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.boss.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.exec.withArgs('which groupadd').returns({
      stdout: groupadd
    })

    cli._execSync.run.withArgs(groupadd + ' ' + cli._config.boss.group).returns(code)

    cli._checkBossGroup(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should complain if creating a group fails on Linux', function(done) {
    var groupadd = 'foo'
    var code = 1

    cli._config.boss.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.boss.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.exec.withArgs('which groupadd').returns({
      stdout: groupadd
    })

    cli._execSync.run.withArgs(groupadd + ' ' + cli._config.boss.group).returns(code)

    cli._checkBossGroup(function(error) {
      expect(error.message).to.equal('Automatically creating group bar failed, please create it manually')

      done()
    })
  })

  it('should create a group on Mac OS', function(done) {
    var dscl = 'foo'
    var groups = 'tomcat                                    257\n' +
      'tty                                       4\n' +
      'utmp                                      45\n' +
      'wheel                                     0\n' +
      'meh                                     500\n'

    cli._config.boss.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.boss.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.exec.withArgs('which groupadd').returns({
      stdout: ''
    })
    cli._execSync.exec.withArgs('which dscl').returns({
      stdout: dscl
    })

    cli._child_process.exec.withArgs('foo . -list /Groups PrimaryGroupID').callsArgWith(1, undefined, groups)
    cli._child_process.exec.withArgs('foo . create /Groups/bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar name bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar passwd "*"').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar gid 501').callsArg(1)
    cli._fs.appendFile.withArgs('/etc/group', 'bar:*:501:\n').callsArg(2)

    cli._checkBossGroup(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should complain if creating a group fails on Mac OS', function(done) {
    var dscl = 'foo'
    var groups = 'tomcat                                    257\n' +
    'tty                                       4\n' +
    'utmp                                      45\n' +
    'wheel                                     0\n'

    cli._config.boss.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.boss.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.exec.withArgs('which groupadd').returns({
      stdout: ''
    })
    cli._execSync.exec.withArgs('which dscl').returns({
      stdout: dscl
    })

    cli._child_process.exec.withArgs('foo . -list /Groups PrimaryGroupID').callsArgWith(1, undefined, groups)
    cli._child_process.exec.withArgs('foo . create /Groups/bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar name bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar passwd "*"').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar gid 500').callsArgWith(1, new Error('Could not create group'))

    cli._checkBossGroup(function(error) {
      expect(error.message).to.equal('Could not create group')

      done()
    })
  })

  it('should complain dscl or groupadd are not present', function(done) {
    cli._config.boss.group = 'foo'
    cli._posix.getgrnam.withArgs(cli._config.boss.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.exec.withArgs('which groupadd').returns({
      stdout: ''
    })
    cli._execSync.exec.withArgs('which dscl').returns({
      stdout: ''
    })

    cli._checkBossGroup(function(error) {
      expect(error.message).to.equal('Automatically creating group foo failed, please create it manually')

      done()
    })
  })
})
