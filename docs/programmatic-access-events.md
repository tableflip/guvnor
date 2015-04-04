# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. guv-web)](remote.md)
1. [Web interface](web.md)
1. [Web interface - configuration](web-config.md)
1. [Web interface - user management](web-users.md)
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. Programmatic access - events

## Programmatic access - events

The guvnor daemon is a [wildemitter](https://github.com/HenrikJoreteg/wildemitter) so you can use wildcards to listen for events:

```javascript
guvnor.on('*', function() {
  var type = arguments[0]
  var args = Array.prototype.slice.call(arguments, 1)

  console.info(type, 'emitted with args', args)
})
```

## Process events

These are events that are to do with managed processes.  They are emitted by processes, cluster managers and workers.  For example:

```javascript
guvnor.on('process:starting', function(processInfo) {
  console.info('process %s is starting', processInfo.name)
})

guvnor.on('cluster:starting', function(clusterInfo) {
  console.info('cluster %s is starting', clusterInfo.name)
})

guvnor.on('worker:starting', function(clusterInfo, workerInfo) {
  console.info('worker %s from cluster %s is starting', workerInfo.id, clusterInfo.name)
})
```

Note that the signature for cluster worker events is slightly different - they receive both the cluster and worker process information.

### 'process:starting' processInfo

A process is about to be created.

### 'process:forked' processInfo

A process is now active (although the v8 instance behind it may still be initialising).

### 'process:failed' processInfo, error

A process wrapper initialised incorrectly - hopefully you will never see this

### 'process:started' processInfo

A process has started and your module code has been loaded.

### 'process:errored' processInfo, error

Your module code threw an exception on start up.

### 'process:ready' processInfo

A connection has been established between guvnor and the managed process. All systems go.

### 'process:stopping' processInfo

A process is about to stop.

### 'process:uncaughtexception' processInfo, error

A process experienced an uncaught exception after startup.

### 'process:fatality' processInfo

A process experienced an uncaught exception and there were no [handlers](http://nodejs.org/api/process.html#process_event_uncaughtexception) for the exception.  The process will now exit with a non-zero error code which will cause it to be be restarted.

### 'process:exit' processInfo, error, code, signal

A process exited or errored with the specified error code.  If a signal was used to kill the process, it will be passed as the second argument.  If the exit code is non-zero the process will be automatically restarted.

### 'process:restarted' processInfo

A process restarted successfully.

### 'process:aborted' processInfo, error

A process failed to (re)start because it error'd on startup more times than allowed.

### 'process:config:request'

A managed process has requested configuration from guvnor

## Cluster events

Cluster events are divided into two types - _cluster_ and _worker_. Cluster events are emitted by the process that manages cluster workers and worker events are emitted by the workers themselves.

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

## Daemon events

These are events that are to do with the guvnor daemon itself.

### 'daemon:fatality' error

Guvnor crashed. Hopefully you'll never see this.

### 'daemon:exit'

The daemon is about to shut down cleanly, usually in response to the `guv kill` command.

### 'daemon:dump'

The daemon has written process information out to `/etc/guvnor/processes.json`, usually in response to the `guv dump` command.

### 'daemon:restore'

The daemon has loaded process information from `/etc/guvnor/processes.json` if available, usually in response to the `guv restore` command.

### 'daemon:config:response'

Guvnor is sending configuration to a managed process

## App events

App events related to installed apps.  An app is a node.js program installed from a git repository containing a `package.json` file at it's root.

### 'app:installed' appInfo

An app was installed. The passed `appInfo` object contains the name, url, etc of the new app.

### 'app:removed' appInfo

An app was removed and all files deleted from the filesystem.  The passed `appInfo` object contains the name, url, etc of the removed app.

### 'app:refs:updated' appInfo, refs

New app refs were pulled from the upstream repository.  The passed `appInfo` object represents the app and `refs` is the list of available ref names.  A ref is a git branch or tag.

### 'app:refs:switched' appInfo, oldRef, newRef

The app represented by `appInfo` was switched from `oldRef` to `newRef`.  A ref is a git branch or tag.

## Log events

There are four types of log event: `info`, `warn`, `error` and `debug`.  Log events are emitted by processes, cluster managers, cluster workers and the guvnor daemon itself.

`info` and `error` correspond to stdout and stderr.

### info

A process emitted an info log event. The log object contains the time and the message.

```javascript
guvnor.on('process:log:info', function(processInfo, log) {
  console.info('process %s said %s at %s', processInfo.name, log.message, log.date)
})

guvnor.on('cluster:log:info', function(clusterInfo, log) {
  console.info('cluster manager %s said %s at %s', clusterInfo.name, log.message, log.date)
})

guvnor.on('worker:log:info', function(clusterInfo, workerInfo, log) {
  console.info('worker %s from cluster %s said %s at %s', workerInfo.id, cluster.name, log.message, log.date)
})

guvnor.on('daemon:log:info', function(log) {
  console.info('guvnor said %s at %s', log.message, log.date)
})
```

### warn

A process emitted an warn log event. The log object contains the time and the message.

```javascript
guvnor.on('process:log:warn', function(processInfo, log) {
  console.warn('process %s said %s at %s', processInfo.name, log.message, log.date)
})

guvnor.on('cluster:log:warn', function(clusterInfo, log) {
  console.warn('cluster manager %s said %s at %s', clusterInfo.name, log.message, log.date)
})

guvnor.on('worker:log:warn', function(clusterInfo, workerInfo, log) {
  console.warn('worker %s from cluster %s said %s at %s', workerInfo.id, cluster.name, log.message, log.date)
})

guvnor.on('daemon:log:warn', function(log) {
  console.warn('guvnor said %s at %s', log.message, log.date)
})
```

### error

A process emitted an error log event. The log object contains the time and the message.

```javascript
guvnor.on('process:log:error', function(processInfo, log) {
  console.error('process %s said %s at %s', processInfo.name, log.message, log.date)
})

guvnor.on('cluster:log:error', function(clusterInfo, log) {
  console.error('cluster manager %s said %s at %s', clusterInfo.name, log.message, log.date)
})

guvnor.on('worker:log:error', function(clusterInfo, workerInfo, log) {
  console.error('worker %s from cluster %s said %s at %s', workerInfo.id, cluster.name, log.message, log.date)
})

guvnor.on('daemon:log:error', function(log) {
  console.error('guvnor said %s at %s', log.message, log.date)
})
```

### debug

A process emitted an debug log event. The log object contains the time and the message.

```javascript
guvnor.on('process:log:debug', function(processInfo, log) {
  console.info('process %s said %s at %s', processInfo.name, log.message, log.date)
})

guvnor.on('cluster:log:debug', function(clusterInfo, log) {
  console.info('cluster manager %s said %s at %s', clusterInfo.name, log.message, log.date)
})

guvnor.on('worker:log:debug', function(clusterInfo, workerInfo, log) {
  console.info('worker %s from cluster %s said %s at %s', workerInfo.id, cluster.name, log.message, log.date)
})

guvnor.on('daemon:log:debug', function(log) {
  console.info('guvnor said %s at %s', log.message, log.date)
})
```
