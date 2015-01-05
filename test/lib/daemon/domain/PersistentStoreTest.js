var expect = require('chai').expect,
  sinon = require('sinon'),
  PersistentStore = require('../../../../lib/daemon/domain/PersistentStore')

describe('PersistentStore', function() {
  var store
  var dir = '/path/to/user/dir'
  var file = 'foo.json'

  beforeEach(function() {
    store = new PersistentStore(null, file)
    store._factory = {
      create: sinon.stub()
    }
    store._fileSystem = {
      getConfDir: sinon.stub()
    }
    store._jsonfile = {
      readFile: sinon.stub(),
      writeFile: sinon.stub()
    }
  })

  it('should read the store file', function(done) {
    var users = [
      {
        name: 'foo',
        secret: 'shush'
      }
    ]

    store._fileSystem.getConfDir.returns(dir)
    store._factory.create.withArgs([users[0]], sinon.match.func).callsArgWithAsync(1, undefined, users[0])
    store._jsonfile.readFile.withArgs(dir + '/' + file, sinon.match.func).callsArgWithAsync(1, undefined, users)

    store.afterPropertiesSet(function(error) {
      expect(error).to.not.exist
      expect(store._store).to.deep.equal(users)

      done()
    })
  })

  it('should write the store file', function(done) {
    var users = [
      {
        name: 'foo',
        secret: 'shush'
      }
    ]

    store._store = users
    store._jsonfile.writeFile.withArgs(file, sinon.match.array).callsArgAsync(3)

    store.save(function(error) {
      expect(error).to.not.exist

      done()
    })
  })
})
