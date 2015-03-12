var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  CLI = require('../../../lib/cli/CLI')

describe('CLI', function () {
  var cli

  beforeEach(function () {
    cli = new CLI()
    cli._config = {
      guvnor: {
        minnodeversion: process.versions.node
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
      parse: sinon.stub(),
      allowUnknownOption: sinon.stub()
    }
    cli._os = {
      platform: sinon.stub()
    }
    cli._prompt = {
      start: sinon.stub(),
      get: sinon.stub()
    }
    cli._execSync = sinon.stub()
    cli._child_process = {
      exec: sinon.stub()
    }
    cli._fs = {
      appendFile: sinon.stub()
    }

    cli._processes = {
      list: sinon.stub(),
      start: sinon.stub(),
      startWebMonitor: sinon.stub(),
      stop: sinon.stub(),
      remove: sinon.stub(),
      restart: sinon.stub(),
      send: sinon.stub(),
      heapdump: sinon.stub(),
      gc: sinon.stub(),
      signal: sinon.stub(),
      write: sinon.stub()
    }
    cli._cluster = {
      setClusterWorkers: sinon.stub()
    }
    cli._daemon = {
      logs: sinon.stub(),
      kill: sinon.stub(),
      dump: sinon.stub(),
      restore: sinon.stub(),
      config: sinon.stub(),
      status: sinon.stub()
    }
    cli._remote = {
      remoteHostConfig: sinon.stub(),
      addRemoteUser: sinon.stub(),
      deleteRemoteUser: sinon.stub(),
      listRemoteUsers: sinon.stub(),
      rotateRemoteUserKeys: sinon.stub(),
      generateSSLCertificate: sinon.stub()
    }
    cli._apps = {
      installApplication: sinon.stub(),
      listApplications: sinon.stub(),
      removeApplication: sinon.stub(),
      listRefs: sinon.stub(),
      updateRefs: sinon.stub(),
      setRef: sinon.stub()
    }

    cli._commander.version.returns(cli._commander)
  })

  it('should set up commander', function () {
    var command = {}
    command.description = sinon.stub().returns(command)
    command.option = sinon.stub().returns(command)
    command.action = sinon.stub().returns(command)
    command.allowUnknownOption = sinon.stub()

    cli._commander.command.returns(command)
    cli._commander.parse.returns({
      rawArgs: ['node', 'command', 'subcommand']
    })

    cli._setUpCommander()
  })

  it('should show process list if no option specified', function (done) {
    var command = {}
    command.description = sinon.stub().returns(command)
    command.option = sinon.stub().returns(command)
    command.action = sinon.stub().returns(command)
    command.allowUnknownOption = sinon.stub()

    cli._commander.command.returns(command)
    cli._commander.parse.returns({
      rawArgs: ['node', 'command', '--option']
    })

    cli._processes.list = done

    cli._setUpCommander()
  })

  it('should reject old versions of node', function (done) {
    cli._config.guvnor.minnodeversion = '500.0.0'

    cli._checkNodeVersion(function (error) {
      expect(error).to.be.ok

      done()
    })
  })

  it('should accept new versions of node', function (done) {
    cli._config.guvnor.minnodeversion = '0.0.1'

    cli._checkNodeVersion(function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should print a warning if the user is in the wrong group on Linux', function () {
    var userName = 'foo'
    cli._user.name = userName
    var guvnorGroup = 'bar'
    var groupsEntry = {
      members: ['baz']
    }

    cli._config.guvnor.group = guvnorGroup
    cli._posix.getgrnam.withArgs(guvnorGroup).returns(groupsEntry)
    cli._os.platform.returns('linux')

    expect(cli._logger.error.called).to.be.false

    cli._checkGuvnorUser(function (error) {
      expect(error).to.be.ok
    })

    expect(cli._logger.error.called).to.be.true
  })

  it('should print a warning if the user is in the wrong group on Mac OS X', function () {
    var userName = 'foo'
    cli._user.name = userName
    var guvnorGroup = 'bar'
    var groupsEntry = {
      members: ['baz']
    }

    cli._config.guvnor.group = guvnorGroup
    cli._posix.getgrnam.withArgs(guvnorGroup).returns(groupsEntry)
    cli._os.platform.returns('darwin')

    expect(cli._logger.error.called).to.be.false

    cli._checkGuvnorUser(function (error) {
      expect(error).to.be.ok
    })

    expect(cli._logger.error.called).to.be.true
  })

  it('should be slient if the user is in the right group', function () {
    var userName = 'foo'
    cli._user.name = userName
    var guvnorGroup = 'bar'
    var groupsEntry = {
      members: [userName]
    }

    cli._config.guvnor.group = guvnorGroup
    cli._posix.getgrnam.withArgs(guvnorGroup).returns(groupsEntry)

    expect(cli._logger.warn.called).to.be.false

    cli._checkGuvnorUser()

    expect(cli._logger.warn.called).to.be.false
  })

  it('should complain if the configured group does not exist', function (done) {
    var userName = 'foo'
    cli._user.name = userName
    var guvnorGroup = 'bar'
    var groupsEntry = {
      members: [userName]
    }

    cli._config.guvnor.group = guvnorGroup
    cli._posix.getgrnam.withArgs(guvnorGroup).throws(new Error('group id does not exist'))

    expect(cli._logger.error.called).to.be.false

    cli._checkGuvnorUser(function (error) {
      expect(error).to.be.ok
      expect(error.message).to.contain('group does not exist')
      expect(cli._logger.error.called).to.be.true

      done()
    })
  })

  it('should create a group on Linux', function (done) {
    var groupadd = 'foo'

    cli._config.guvnor.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.guvnor.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.withArgs('which groupadd').returns(groupadd)
    cli._execSync.withArgs(groupadd + ' ' + cli._config.guvnor.group).returns('')

    cli._checkGuvnorGroup(function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should complain if creating a group fails on Linux', function (done) {
    var groupadd = 'foo'

    cli._config.guvnor.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.guvnor.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.withArgs('which groupadd').returns(groupadd)
    cli._execSync.withArgs(groupadd + ' ' + cli._config.guvnor.group).throws(new Error('urk!'))

    cli._checkGuvnorGroup(function (error) {
      expect(error.message).to.equal('Automatically creating group bar failed, please create it manually')

      done()
    })
  })

  it('should create a group on Mac OS X', function (done) {
    var dscl = 'foo'
    var groups = 'tomcat                                    257\n' +
    'tty                                       4\n' +
    'utmp                                      45\n' +
    'wheel                                     0\n' +
    'meh                                     500\n'

    cli._config.guvnor.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.guvnor.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.withArgs('which groupadd').throws(new Error('no command found'))
    cli._execSync.withArgs('which dscl').returns(dscl)

    cli._child_process.exec.withArgs('foo . -list /Groups PrimaryGroupID').callsArgWith(1, undefined, groups)
    cli._child_process.exec.withArgs('foo . create /Groups/bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar name bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar passwd "*"').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar gid 501').callsArg(1)
    cli._fs.appendFile.withArgs('/etc/group', 'bar:*:501:\n').callsArg(2)

    cli._checkGuvnorGroup(function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should complain if creating a group fails on Mac OS', function (done) {
    var dscl = 'foo'
    var groups = 'tomcat                                    257\n' +
    'tty                                       4\n' +
    'utmp                                      45\n' +
    'wheel                                     0\n'

    cli._config.guvnor.group = 'bar'

    cli._posix.getgrnam.withArgs(cli._config.guvnor.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.withArgs('which groupadd').throws(new Error('no command found'))
    cli._execSync.withArgs('which dscl').returns(dscl)

    cli._child_process.exec.withArgs('foo . -list /Groups PrimaryGroupID').callsArgWith(1, undefined, groups)
    cli._child_process.exec.withArgs('foo . create /Groups/bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar name bar').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar passwd "*"').callsArg(1)
    cli._child_process.exec.withArgs('foo . create /Groups/bar gid 500').callsArgWith(1, new Error('Could not create group'))

    cli._checkGuvnorGroup(function (error) {
      expect(error.message).to.equal('Could not create group')

      done()
    })
  })

  it('should complain dscl or groupadd are not present', function (done) {
    cli._config.guvnor.group = 'foo'
    cli._posix.getgrnam.withArgs(cli._config.guvnor.group).throws(new Error('group id does not exist'))
    cli._prompt.get.callsArg(1)

    cli._execSync.withArgs('which groupadd').throws(new Error('no command found'))
    cli._execSync.withArgs('which dscl').throws(new Error('no command found'))

    cli._checkGuvnorGroup(function (error) {
      expect(error.message).to.equal('Automatically creating group foo failed, please create it manually')

      done()
    })
  })
})
