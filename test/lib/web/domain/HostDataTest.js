var HostData = require('../../../../lib/web/domain/HostData')
var sinon = require('sinon')
var expect = require('chai').expect
var EventEmitter = require('wildemitter')

describe('HostData', function () {
  var data
  var credentials = {}

  beforeEach(function () {
    data = new HostData('test', credentials)
    data._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    data._config = {
      frequency: 5000
    }
    data._processDataFactory = {
      create: sinon.stub()
    }
    data._webSocketResponder = {
      broadcast: sinon.stub()
    }
  })

  it('should remove missing processes', function () {
    data.processes.push({
      id: 'foo'
    })
    data.processes.push({
      id: 'bar'
    })

    expect(data.processes.length).to.equal(2)

    data._removeMissingProcesses([{
      id: 'foo'
    }])

    expect(data.processes.length).to.equal(1)
    expect(data.processes[0].id).to.equal('foo')
  })

  it('should find process by id', function () {
    data.processes.push({
      id: 'foo'
    })
    data.processes.push({
      id: 'bar'
    })

    var returned = data.findProcessById('bar')

    expect(returned.id).to.equal('bar')
  })

  it('should fail to find process by id', function () {
    data.processes.push({
      id: 'foo'
    })
    data.processes.push({
      id: 'bar'
    })

    var returned = data.findProcessById('baz')

    expect(returned).to.not.exist
  })

  it('should find worker process by id', function () {
    data.processes.push({
      id: 'foo'
    })
    data.processes.push({
      id: 'bar',
      workers: [
        {id: 'qux'},
        {id: 'baz'}
      ]
    })

    var returned = data.findProcessById('baz')

    expect(returned.id).to.equal('baz')
  })

  it('should find apps', function (done) {
    var apps = []
    data._daemon = {
      listApplications: sinon.stub()
    }
    data._daemon.listApplications.callsArgWithAsync(0, undefined, apps)

    data.findApps(function (error, returnedApps) {
      expect(error).not.to.exist
      expect(returnedApps).to.equal(apps)

      done()
    })
  })

  it('should return empty array for apps when remote not connected', function (done) {
    data.findApps(function (error, apps) {
      expect(error).not.to.exist
      expect(apps.length).to.equal(0)

      done()
    })
  })

  it('should handle a remote timeout', function () {
    var error = new Error()
    error.code = 'TIMEOUT'
    data.lastUpdated = 10

    data._handleRemoteError(error)

    expect(data.status).to.equal('timeout')
  })

  it('should not mark data as timedout when a recent update had occured', function () {
    var error = new Error()
    error.code = 'TIMEOUT'
    data.lastUpdated = Date.now() - 10

    data.status = 'connected'

    data._handleRemoteError(error)

    expect(data.status).to.equal('connected')
  })

  it('should handle a remote signature failure', function () {
    var error = new Error()
    error.code = 'INVALIDSIGNATURE'

    data._handleRemoteError(error)

    expect(data.status).to.equal('badsignature')
  })

  it('should handle an unknown remote error', function () {
    var error = new Error()

    data._handleRemoteError(error)

    expect(data.status).to.equal('error')
  })

  it('should connect to remote after properties set', function (done) {
    data._connectToDaemon = done

    data.afterPropertiesSet()
  })

  it('should connect to remote', function (done) {
    data._remote = function (logger, credentials, callback) {
      expect(data.status).to.equal('connecting')
      expect(logger).to.equal(data._logger)
      expect(credentials).to.equal(data._data)
      expect(callback).to.be.a('function')

      done()
    }

    data._connectToDaemon()
  })

  it('should update details from server', function (done) {
    var arg = {}

    data._daemon = {
      foo: sinon.stub()
    }
    data._daemon.foo.callsArgWithAsync(0, undefined, arg)

    data._update('foo', function (returned, callback) {
      expect(returned).to.equal(arg)

      callback()

      expect(data.bar).to.be.ok
      clearTimeout(data.bar)

      done()
    }, 'bar')
  })

  it('should handle error when updating details from server', function () {
    data._daemon = {
      foo: sinon.stub()
    }
    data._daemon.foo.callsArgWith(0, new Error())

    var update = sinon.stub()

    data._update('foo', update, 'bar')

    // should be have error status
    expect(data.status).to.equal('error')

    // should not have updated anything
    expect(update.called).to.be.false

    // should have set a timeout to try again later
    expect(data.bar).to.be.ok
    clearTimeout(data.bar)
  })

  it('should handle updated server status', function (done) {
    var status = {
      foo: 'bar'
    }

    expect(data.foo).to.not.exist

    data._handleUpdatedServerStatus(status, function () {
      expect(data.foo).to.equal('bar')
      expect(data._webSocketResponder.broadcast.called).to.be.true

      done()
    })
  })

  it('should handle new processes', function (done) {
    var processes = [{
      id: 'foo'
    }, {
      id: 'bar'
    }]

    var createdProcesses = [{
      id: 'foo',
      update: sinon.stub()
    }, {
      id: 'bar',
      update: sinon.stub()
    }]

    data._processDataFactory.create.withArgs([processes[0]]).callsArgWithAsync(1, undefined, createdProcesses[0])
    data._processDataFactory.create.withArgs([processes[1]]).callsArgWithAsync(1, undefined, createdProcesses[1])

    expect(data.processes.length).to.equal(0)

    data._handleUpdatedProcesses(processes, function () {
      expect(data.processes.length).to.equal(2)

      done()
    })
  })

  it('should handle updated processes', function (done) {
    var processes = [{
      id: 'foo'
    }, {
      id: 'bar'
    }]

    var createdProcesses = [{
      id: 'foo',
      update: sinon.stub()
    }, {
      id: 'bar',
      update: sinon.stub()
    }]

    data._processDataFactory.create.withArgs([processes[0]]).callsArgWithAsync(1, undefined, createdProcesses[0])

    data.processes.push(createdProcesses[1])

    data._handleUpdatedProcesses(processes, function () {
      expect(data.processes.length).to.equal(2)

      expect(createdProcesses[0].update.called).to.be.false
      expect(createdProcesses[1].update.called).to.be.true

      done()
    })
  })

  it('should handle connection refused when connecting to remote', function () {
    var error = new Error()
    error.code = 'CONNECTIONREFUSED'

    data._connectedToDaemon(error)

    expect(data.status).to.equal('connectionrefused')
  })

  it('should handle connection reset when connecting to remote', function () {
    var error = new Error()
    error.code = 'CONNECTIONRESET'

    data._connectedToDaemon(error)

    expect(data.status).to.equal('connectionreset')
  })

  it('should handle host not found when connecting to remote', function () {
    var error = new Error()
    error.code = 'HOSTNOTFOUND'

    data._connectedToDaemon(error)

    expect(data.status).to.equal('hostnotfound')
  })

  it('should handle connection timeout when connecting to remote', function () {
    var error = new Error()
    error.code = 'TIMEDOUT'

    data._connectedToDaemon(error)

    expect(data.status).to.equal('connectiontimedout')
  })

  it('should handle network down when connecting to remote', function () {
    var error = new Error()
    error.code = 'NETWORKDOWN'

    data._connectedToDaemon(error)

    expect(data.status).to.equal('networkdown')
  })

  it('should handle unknown error when connecting to remote', function () {
    var error = new Error()

    data._connectedToDaemon(error)

    expect(data.status).to.equal('error')
  })

  it('should remove disconnected listener if reconnecting to daemon', function () {
    var oldDaemon = {
      off: sinon.stub()
    }
    var newDaemon = {
      once: sinon.stub(),
      getDetails: sinon.stub()
    }

    data._daemon = oldDaemon

    data._connectedToDaemon(undefined, newDaemon)

    expect(oldDaemon.off.calledWith('disconnected')).to.be.true
  })

  it('should remove listeners when daemon disconnects', function () {
    var newDaemon = {
      on: sinon.stub(),
      once: sinon.stub(),
      getDetails: sinon.stub(),
      off: sinon.stub()
    }
    var details = {
      guvnor: '2.4.2'
    }

    data._config.minVersion = '^2.0.0'
    data._update = sinon.stub()

    newDaemon.getDetails.callsArgWith(0, undefined, details)

    data._connectedToDaemon(undefined, newDaemon)

    expect(newDaemon.once.callCount).to.equal(1)
    expect(newDaemon.once.getCall(0).args[0]).to.equal('disconnected')
    newDaemon.once.getCall(0).args[1]()

    for (var i = 0; i < newDaemon.on.callCount; i++) {
      expect(newDaemon.off.calledWith(newDaemon.on.getCall(i).args[0])).to.be.true
    }

    expect(data.status).to.equal('connecting')
  })

  it('should handle remote error when getting daemon status', function () {
    var newDaemon = {
      once: sinon.stub(),
      getDetails: sinon.stub(),
      off: sinon.stub()
    }

    newDaemon.getDetails.callsArgWith(0, new Error())

    data._connectedToDaemon(undefined, newDaemon)

    expect(data.status).to.equal('error')
  })

  it('should mark daemon as incompatible when version is too old', function () {
    var newDaemon = {
      once: sinon.stub(),
      getDetails: sinon.stub(),
      off: sinon.stub()
    }
    var details = {
      guvnor: '1.0.0'
    }

    data._config.minVersion = '^2.0.0'

    newDaemon.getDetails.callsArgWith(0, undefined, details)

    data._connectedToDaemon(undefined, newDaemon)

    expect(data.guvnor).to.equal('1.0.0')
    expect(data.status).to.equal('incompatible')
  })

  it('should mark daemon as connected when connection is successful', function () {
    var newDaemon = {
      once: sinon.stub(),
      getDetails: sinon.stub(),
      off: sinon.stub(),
      on: sinon.stub()
    }
    var details = {
      guvnor: '2.4.2'
    }

    data._config.minVersion = '^2.0.0'
    data._update = sinon.stub()

    newDaemon.getDetails.callsArgWith(0, undefined, details)

    data._connectedToDaemon(undefined, newDaemon)

    expect(data.guvnor).to.equal('2.4.2')
    expect(data.status).to.equal('connected')
    expect(data._update.calledWith('getServerStatus')).to.be.true
    expect(data._update.calledWith('listProcesses')).to.be.true
  })

  it('should pass log event to process', function () {
    var proc = {
      id: 'foo',
      log: sinon.stub()
    }

    data.processes.push(proc)
    data._daemon = new EventEmitter()

    data._listenForLogEvents()

    data._daemon.emit('process:log:error', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz'
    })

    expect(proc.log.calledWith('error', 'bar', 'baz')).to.be.true
  })

  it('should survive not finding a process when passing a log event to process', function () {
    data._daemon = new EventEmitter()

    data._listenForLogEvents()

    data._daemon.emit('process:log:error', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz'
    })
  })

  it('should pass cluster event to process', function () {
    var proc = {
      id: 'foo',
      log: sinon.stub()
    }

    data.processes.push(proc)
    data._daemon = new EventEmitter()

    data._listenForLogEvents()

    data._daemon.emit('cluster:log:error', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz'
    })

    expect(proc.log.calledWith('error', 'bar', 'baz')).to.be.true
  })

  it('should survive not finding a process when passing a cluster event to process', function () {
    data._daemon = new EventEmitter()

    data._listenForLogEvents()

    data._daemon.emit('cluster:log:error', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz'
    })
  })

  it('should pass worker event to process', function () {
    var proc = {
      id: 'bar',
      log: sinon.stub()
    }

    data.processes.push(proc)
    data._daemon = new EventEmitter()

    data._listenForLogEvents()

    data._daemon.emit('worker:log:error', {
      id: 'foo'
    }, {
      id: 'bar'
    }, {
      date: 'baz',
      message: 'qux'
    })

    expect(proc.log.calledWith('error', 'baz', 'qux')).to.be.true
  })

  it('should survive not finding a process when passing a worker event to process', function () {
    data._daemon = new EventEmitter()

    data._listenForLogEvents()

    data._daemon.emit('worker:log:error', {
      id: 'foo'
    }, {
      id: 'bar'
    }, {
      date: 'baz',
      message: 'qux'
    })
  })

  it('should pass uncaught exception to process', function () {
    data._daemon = new EventEmitter()
    data._listenForUncaughtExceptions()

    var proc = {
      id: 'foo',
      exception: sinon.stub()
    }

    data.processes.push(proc)

    data._daemon.emit('process:uncaughtexception', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz',
      code: 'qux',
      stack: 'quux'
    })

    expect(proc.exception.calledWith('bar', 'baz', 'qux', 'quux')).to.be.true
  })

  it('should survive not finding a process when passing uncaught exception to process', function () {
    data._daemon = new EventEmitter()
    data._listenForUncaughtExceptions()

    data._daemon.emit('process:uncaughtexception', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz',
      code: 'qux',
      stack: 'quux'
    })
  })

  it('should store exception when process fails', function () {
    data._daemon = new EventEmitter()
    data._listenForUncaughtExceptions()

    var proc = {
      id: 'foo',
      exception: sinon.stub()
    }

    data.processes.push(proc)

    data._daemon.emit('process:failed', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz',
      code: 'qux',
      stack: 'quux'
    })

    expect(proc.exception.calledWith('bar', 'baz', 'qux', 'quux')).to.be.true
  })

  it('should survive not finding a process when a process fails', function () {
    data._daemon = new EventEmitter()
    data._listenForUncaughtExceptions()

    data._daemon.emit('process:failed', {
      id: 'foo'
    }, {
      date: 'bar',
      message: 'baz',
      code: 'qux',
      stack: 'quux'
    })
  })

  it('should broadcast process events', function () {
    var newDaemon = {
      once: sinon.stub(),
      getDetails: sinon.stub(),
      off: sinon.stub(),
      on: sinon.stub()
    }
    var details = {
      guvnor: '2.4.2'
    }

    data._config.minVersion = '^2.0.0'
    data._update = sinon.stub()

    var proc = {
      id: 'foo',
      exception: sinon.stub()
    }

    data.processes.push(proc)

    newDaemon.getDetails.callsArgWith(0, undefined, details)

    data._connectedToDaemon(undefined, newDaemon)

    expect(newDaemon.on.getCall(9).args[0]).to.equal('*')

    newDaemon.on.getCall(9).args[1]('foo', 'bar')

    expect(data._webSocketResponder.broadcast.calledWith('foo', 'test', 'bar')).to.be.true
  })

  it('should store heap snapshots', function () {
    var proc = {
      id: 'foo',
      snapshot: sinon.stub()
    }
    var snapshot = {
      id: 'bar',
      date: 'baz',
      path: 'qux',
      size: 'quux'
    }

    data.processes.push(proc)
    data._daemon = new EventEmitter()

    data._listenForHeapSnapshots()

    data._daemon.emit('process:heapdump:complete', {
      id: proc.id
    }, snapshot)

    expect(proc.snapshot.called).to.be.true
    expect(proc.snapshot.getCall(0).args).to.deep.equal([
      snapshot.id, snapshot.date, snapshot.path, snapshot.size
    ])
  })

  it('should survive not finding a process when adding heap snapshots', function () {
    var snapshot = {
      id: 'foo'
    }

    data._daemon = new EventEmitter()

    data._listenForHeapSnapshots()

    data._daemon.emit('process:heapdump:complete', {
      id: 'bar'
    }, snapshot)
  })

  it('should remove heap snapshots', function () {
    var proc = {
      id: 'foo',
      removeSnapshot: sinon.stub()
    }
    var snapshot = {
      id: 'bar'
    }

    data.processes.push(proc)
    data._daemon = new EventEmitter()

    data._listenForHeapSnapshots()

    data._daemon.emit('process:heapdump:removed', {
      id: proc.id
    }, snapshot)

    expect(proc.removeSnapshot.called).to.be.true
    expect(proc.removeSnapshot.getCall(0).args[0]).to.equal(snapshot.id)
  })

  it('should survive not finding a process when removing heap snapshots', function () {
    var snapshot = {
      id: 'foo'
    }

    data._daemon = new EventEmitter()

    data._listenForHeapSnapshots()

    data._daemon.emit('process:heapdump:removed', {
      id: 'bar'
    }, snapshot)
  })
})
