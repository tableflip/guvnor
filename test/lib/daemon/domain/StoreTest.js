var expect = require('chai').expect,
  sinon = require('sinon'),
  Store = require('../../../../lib/daemon/domain/Store')

describe('Store', function() {
  var store

  beforeEach(function() {
    store = new Store()
    store._factory = {
      create: sinon.stub()
    }
  })

  it('should find items in the store', function() {
    var users = [
      {
        name: 'foo',
        secret: 'shush'
      },
      {
        name: 'bar',
        secret: 'shush'
      }
    ]

    store._store = users

    var result = store.find('name', 'foo')

    expect(result).to.equal(users[0])
  })

  it('should find items in the store with deep keys', function() {
    var users = [
      {
        name: 'foo',
        secret: 'shush'
      },
      {
        name: 'bar',
        secret: 'shush',
        sub: {
          value: 'hello'
        }
      }
    ]

    store._store = users

    var result = store.find('sub.value', 'hello')

    expect(result).to.equal(users[1])
  })

  it('should remove items from the store', function() {
    var users = [
      {
        name: 'foo',
        secret: 'shush'
      },
      {
        name: 'bar',
        secret: 'shush',
        sub: {
          value: 'hello'
        }
      }
    ]

    store._store = users

    store.remove('name', 'foo')

    expect(store._store.length).to.equal(1)
    expect(store._store[0].name).to.equal('bar')
  })

  it('should remove items from the store with deep keys', function() {
    var users = [
      {
        name: 'foo',
        secret: 'shush'
      },
      {
        name: 'bar',
        secret: 'shush',
        sub: {
          value: 'hello'
        }
      }
    ]

    store._store = users

    store.remove('sub.value', 'hello')

    expect(store._store.length).to.equal(1)
    expect(store._store[0].name).to.equal('foo')
  })
})
