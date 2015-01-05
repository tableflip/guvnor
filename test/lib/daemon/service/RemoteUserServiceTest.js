var expect = require('chai').expect,
  sinon = require('sinon'),
  RemoteUserService = require('../../../../lib/daemon/service/RemoteUserService')

describe('RemoteUserService', function() {
  var service

  beforeEach(function() {
    service = new RemoteUserService()
    service._remoteUserStore = {
      save: sinon.stub(),
      find: sinon.stub(),
      remove: sinon.stub(),
      create: sinon.stub(),
      all: sinon.stub()
    }
    service._posix = {
      getpwnam: sinon.stub()
    }
    service._fs = {
      exists: sinon.stub()
    }
    service._os = {
      hostname: sinon.stub()
    }
  })

  it('should find a user', function(done) {
    var user = {
      name: 'foo',
      secret: 'shush'
    }

    service._remoteUserStore.find.withArgs('name', 'foo').returns(user)

    service.findUser('foo', function(error, user) {
      expect(error).to.not.exist
      expect(user).to.deep.equal({
        name: 'foo',
        secret: 'shush'
      })

      done()
    })
  })

  it('should create a user', function(done) {
    var userName = 'foo'
    var user = {
      uid: 5,
      name: userName
    }

    service._posix.getpwnam.withArgs(userName).returns(user)
    service._remoteUserStore.create.callsArgWith(1, undefined, {
      secret: 'asdf'
    })
    service._remoteUserStore.save.callsArgWith(0, undefined)

    service.createUser(userName, function(error, user) {
      expect(error).to.not.exist
      expect(user.secret).to.be.ok

      done()
    })
  })

  it('should fail to create when username is invalid', function(done) {
    var userName = 'foo'

    service._posix.getpwnam.withArgs(userName).throws("Who?!")

    service.createUser(userName, function(error, user) {
      expect(error).to.be.ok
      expect(error.code).to.equal('INVALIDUSER')
      expect(user).to.not.exist

      done()
    })
  })

  it('should not create a user when the user already exists', function(done) {
    var userName = 'foo'
    var users = [
      {
        name: userName,
        secret: 'shh'
      }
    ]

    service._remoteUserStore.find.withArgs('name', userName).returns(users[0])

    service.findOrCreateUser(userName, function(error, user) {
      expect(error).to.not.exist
      expect(user.secret).to.be.ok

      expect(service._remoteUserStore.save.called).to.be.false

      done()
    })
  })

  it('should remove a user', function() {
    var userName = 'foo'

    service.removeUser(userName)

    expect(service._remoteUserStore.remove.withArgs('name', userName).called).to.be.true
    expect(service._remoteUserStore.save.called).to.be.true
  })

  it('should rotate keys for a user', function(done) {
    var userName = 'foo'
    var originalUser = {
      name: userName,
      secret: 'shush'
    }

    service._remoteUserStore.find.withArgs('name', userName).returns(originalUser)
    service._remoteUserStore.save.callsArgWith(0, undefined)

    var originalSecret = originalUser.secret

    service.rotateKeys(userName, function(error, user) {
      expect(error).to.not.exist
      expect(user).to.equal(originalUser)

      expect(user.secret).to.be.ok
      expect(user.secret).to.not.equal(originalSecret)

      done()
    })
  })

  it('should list users', function(done) {
    var users = [
      {
        name: 'foo',
        secret: 'shush'
      }
    ]

    service._remoteUserStore.all.returns(users)

    service.listUsers(function(error, userlist) {
      expect(error).to.not.exist

      expect(userlist.foo).to.equal(users.foo)

      done()
    })
  })
})
