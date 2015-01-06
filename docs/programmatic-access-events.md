# Help

1. [Starting and stopping processes](processes.md)
1. [Controling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. boss-web)](remote.md)
1. [Web interface](web.md)
1. [Web interface - configuration](web-config.md)
1. [Web interface - user management](web-uesrs.md)
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Programmatic access - events

The boss daemon is a [wildemitter](https://github.com/HenrikJoreteg/wildemitter) so you can use wildcards to listen for events:

```javascript
boss.on('*', function() {
  var type = arguments[0]
  var args = Array.prototype.slice.call(arguments, 1)

  console.info(type, 'emitted with args', args)
})
```

## Process events

These are events that are to do with managed processes.

### 'process:starting' processInfo

A process is about to be created.

### 'process:forked:' processInfo

A process is now active (although the v8 instance behind it may still be initialising).

### 'process:failed' processInfo, error

A process wrapper initialised incorrectly - hopefully you will never see this

### 'process:started:' processInfo

A process has started and your module code has been loaded.

### 'process:errored:' processInfo, error

Your module code threw an exception on start up.

### 'process:ready' processInfo

A connection has been established between boss and the managed process. All systems go.

### 'process:stopping' processInfo

A process is about to stop.

### 'process:uncaughtexception' processInfo, error

A process experienced an uncaught exception after startup.

### 'process:fatality' processInfo

A process experienced an uncaught exception and there were no [handlers](http://nodejs.org/api/process.html#process_event_uncaughtexception) for the exception.  The process will now exit with a non-zero error code which will cause it to be be restarted.

### 'process:exit' processInfo, error, code, signal

A process exited or errored with the specified error code.  If a signal was used to kill the process, it will be passed as the second argument.  If the exit code is non-zero the process will be automatically restarted.

### 'process:restarted' processInfo, oldPid

A process restarted succesfully.  ProcessInfo associated with the process is passed as is the pid of the old process that failed.

### 'process:aborted' processInfo, error

A process failed to (re)start because it error'd on startup more times than allowed.

### 'process:log:info'

A process emitted an info log event.  The log object contains the time and the message.

```javascript
// for a specific process id
boss.on('process:log:info:1', function(log) {
  console.info(log.date, log.message)
})

// for all processes
boss.on('process:log:info:*', function(type, log) {
  console.info(log.date, log.message)
})
```

### 'process:log:warn'

A process emitted an warn log event.  The log object contains the time and the message.

```javascript
// for a specific process id
boss.on('process:log:warn:1', function(log) {
  console.warn(log.date, log.message)
})

// for all processes
boss.on('process:log:warn:*', function(type, log) {
  console.warn(log.date, log.message)
})
```

### 'process:log:error' log

A process emitted an error log event.  The log object contains the time and the message.

```javascript
// for a specific process id
boss.on('process:log:error:1', function(log) {
  console.error(log.date, log.message)
})

// for all processes
boss.on('process:log:error:*', function(type, log) {
  console.error(log.date, log.message)
})
```

### 'process:log:debug' log

A process emitted an debug log event.  The log object contains the time and the message.

```javascript
// for a specific process id
boss.on('process:log:debug:1', function(log) {
  console.info(log.date, log.message)
})

// for all processes
boss.on('process:log:debug:*', function(type, log) {
  console.info(log.date, log.message)
})
```

### 'process:config:request'

A managed process has requested configuration from boss

## Daemon events

These are events that are to do with the boss daemon itself.

### 'boss:fatality' error

Boss crashed. Hopefully you'll never see this.

### 'boss:config:response'

Boss is sending configuration to a managed process

### 'boss:log:info' log

Boss emitted an info log event. The log object contains the time and the message.

### 'boss:log:warn' log

Boss emitted a warn log event. The log object contains the time and the message.

### 'boss:log:error' log

Boss emitted an error log event. The log object contains the time and the message.

### 'boss:log:debug' log

Boss emitted a debug log event.  The log object contains the time and the message.

### 'cluster:starting' processInfo

A cluster manager is starting

### 'cluster:ready' clusterInfo

A cluster manager has started and can be connect to

### 'cluster:failed' clusterInfo, error

A cluster manager has failed to start

### 'cluster:online' clusterInfo

A cluster manager and all it's worker processes are ready

### 'worker:new' clusterInfo, workerInfo

A new cluster worker was created

### 'worker:stopping:' clusterInfo, workerInfo

A worker is about to get killed

### 'worker:exit' clusterInfo, workerInfo, code, signal

A worker exited with the passed code. If a signal was used to kill the worker, it is passed as the third argument to the callback.
