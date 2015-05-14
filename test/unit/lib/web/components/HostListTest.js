var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var HostList = require('../../../../../lib/web/components/HostList')

describe('HostList', function () {
  var list

  beforeEach(function () {
    list = new HostList()
    list._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    list._config = {}
    list._hostDataFactory = {}
    list._mdns = {}
  })

  it('should survive mdns not being available', function () {
    list._mdns = null

    list._createMdnsBrowser()
  })

  it('should start mdns browser', function () {
    var browser = {
      on: sinon.stub(),
      start: sinon.stub()
    }
    var service = {}

    list._mdns.tcp = sinon.stub()
    list._mdns.createBrowser = sinon.stub()

    list._mdns.tcp.withArgs('guvnor-rpc').returns(service)
    list._mdns.createBrowser.withArgs(service).returns(browser)

    list._createMdnsBrowser('guvnor-rpc')

    expect(browser.start.called).to.be.true
  })

  it('should warn on mdns error', function () {
    var browser = {
      on: sinon.stub(),
      start: sinon.stub()
    }
    var service = {}

    list._mdns.tcp = sinon.stub()
    list._mdns.createBrowser = sinon.stub()

    list._mdns.tcp.withArgs('guvnor-rpc').returns(service)
    list._mdns.createBrowser.withArgs(service).returns(browser)

    list._createMdnsBrowser('guvnor-rpc')

    expect(browser.on.getCall(0).args[0]).to.equal('error')
    expect(browser.on.getCall(0).args[1]).to.be.instanceof(Function)
    browser.on.getCall(0).args[1]({})

    expect(list._logger.warn.called).to.be.true
  })

  it('should ignore mdns guvnor advert with no configuration', function () {
    list._config.hosts = {}

    var browser = {
      on: sinon.stub(),
      start: sinon.stub()
    }
    var service = {}

    list._mdns.tcp = sinon.stub()
    list._mdns.createBrowser = sinon.stub()

    list._mdns.tcp.withArgs('guvnor-rpc').returns(service)
    list._mdns.createBrowser.withArgs(service).returns(browser)

    list._createMdnsBrowser('guvnor-rpc')

    expect(browser.on.getCall(1).args[0]).to.equal('serviceUp')
    expect(browser.on.getCall(1).args[1]).to.be.instanceof(Function)
    browser.on.getCall(1).args[1]({})

    expect(list._hostData).to.be.empty
  })

  it('should ignore duplicated mdns guvnor', function () {
    list._config.hosts = {'foo': {}}
    list._hostData.foo = {}

    var browser = {
      on: sinon.stub(),
      start: sinon.stub()
    }
    var service = {}

    list._mdns.tcp = sinon.stub()
    list._mdns.createBrowser = sinon.stub()

    list._mdns.tcp.withArgs('guvnor-rpc').returns(service)
    list._mdns.createBrowser.withArgs(service).returns(browser)

    list._createMdnsBrowser('guvnor-rpc')

    expect(browser.on.getCall(1).args[0]).to.equal('serviceUp')
    expect(browser.on.getCall(1).args[1]).to.be.instanceof(Function)
    browser.on.getCall(1).args[1]({
      name: 'foo'
    })

    expect(Object.keys(list._hostData).length).to.equal(1)
  })

  it('should create host data from mdns advert', function () {
    list._config.hosts = {'foo': {}}

    var browser = {
      on: sinon.stub(),
      start: sinon.stub()
    }
    var service = {}

    list._mdns.tcp = sinon.stub()
    list._mdns.createBrowser = sinon.stub()

    list._mdns.tcp.withArgs('guvnor-rpc').returns(service)
    list._mdns.createBrowser.withArgs(service).returns(browser)

    list._createMdnsBrowser('guvnor-rpc')

    list._hostDataFactory.create = sinon.stub()

    expect(browser.on.getCall(1).args[0]).to.equal('serviceUp')
    expect(browser.on.getCall(1).args[1]).to.be.instanceof(Function)
    browser.on.getCall(1).args[1]({
      name: 'foo'
    })

    expect(list._hostData.foo).to.be.true

    var hostData = {}

    list._hostDataFactory.create.getCall(0).args[1](undefined, hostData)

    expect(list._hostData.foo).to.equal(hostData)
  })

  it('should ignore host data when creating host data fails', function () {
    list._config.hosts = {'foo': {}}

    var browser = {
      on: sinon.stub(),
      start: sinon.stub()
    }
    var service = {}

    list._mdns.tcp = sinon.stub()
    list._mdns.createBrowser = sinon.stub()

    list._mdns.tcp.withArgs('guvnor-rpc').returns(service)
    list._mdns.createBrowser.withArgs(service).returns(browser)

    list._createMdnsBrowser('guvnor-rpc')

    list._hostDataFactory.create = sinon.stub()

    expect(browser.on.getCall(1).args[0]).to.equal('serviceUp')
    expect(browser.on.getCall(1).args[1]).to.be.instanceof(Function)
    browser.on.getCall(1).args[1]({
      name: 'foo'
    })

    expect(list._hostData.foo).to.be.true

    var hostData = {}

    list._hostDataFactory.create.getCall(0).args[1](new Error('urk!'))

    expect(list._hostData).to.be.empty
  })

  it('should return hosts as array', function () {
    list._hostData['foo'] = 'bar'

    var output = list.getHosts()

    expect(output).to.be.instanceof(Array)
    expect(output).to.contain('bar')
  })

  it('should return host by name', function () {
    list._hostData['foo'] = 'bar'

    var output = list.getHostByName('foo')

    expect(output).to.equal('bar')
  })

  it('should create host data', function () {
    list._config.hosts = {
      'foo': {
        host: 'host',
        port: 10
      }
    }

    list._hostDataFactory = {
      create: sinon.stub()
    }

    var hostData = {}

    list._hostDataFactory.create.withArgs(['foo', list._config.hosts.foo]).callsArgWith(1, undefined, hostData)

    list._createHostData()

    expect(list._hostData.foo).to.equal(hostData)
  })

  it('should ignore invalid host data', function () {
    list._config.hosts = {
      'foo': {
        host: 'host'
      }
    }

    list._createHostData()

    expect(list._hostData).to.be.empty
  })

  it('should ignore host data that errors', function () {
    list._config.hosts = {
      'foo': {
        host: 'host',
        port: 10
      }
    }

    list._hostDataFactory = {
      create: sinon.stub()
    }

    var hostData = {}

    list._hostDataFactory.create.withArgs(['foo', list._config.hosts.foo]).callsArgWith(1, new Error('urk!'), hostData)

    list._createHostData()

    expect(list._hostData).to.be.empty
  })

  it('should create host data and mdns browser', function () {
    list._createHostData = sinon.stub()
    list._createMdnsBrowser = sinon.stub()

    list.afterPropertiesSet()

    expect(list._createHostData.called).to.be.true
    expect(list._createMdnsBrowser.called).to.be.true
  })
})
