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
1. Programmatic access - local
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Programmatic access - local

A interface to an instance of [guvnor](http://github.com/tableflip/guvnor) running on the same host.

## Usage

```javascript
var Local = require('guvnor').Local
```

All methods take an optional config argument and an optional logger argument.

#### `config`

The config argument is a plain object of config settings as loaded from the config file.  If omitted, the [default config](../guvnor) file will be loaded and it's properties overwritten by the config file at `/etc/guvnor/guvnor` if available.

#### `logger`

If specified the logger argument must have the following structure:

```javascript
{
  info: function() {},
  warn: function() {},
  error: function() {},
  debug: function() {}
}
```

If omitted it defaults to `console.info` and friends with `debug` being a no-op.

### Local.running([config], [logger], callback(running))

The passed callback will receive a boolean value indicating if the daemon is running or not.

```javascript
Local.running(function(running) {
  console.info('Daemon is', running ? 'running' : 'not running')
})
```

### Local.connect([config], [logger], callback(error, daemon))

Attempts to connect to an already running daemon. If the daemon is not running the callback will receive an error.

```javascript
Local.connect(function(error, daemon) {
  if(error) {
    if(error.code == 'DAEMON_NOT_RUNNING') {
      // .. no daemon was running on this machine
    } else {
      throw error
    }
  }

  daemon.listProcesses(function(error, processes) {
    // ...
  })
})
```

### Local.connectOrStart([config], [logger], callback(error, daemon))

Attempts to connect to an already running daemon. If the daemon is not running it will attempt to start the daemon.

If this fails for any reason, the callback will receive an error.

```javascript
Local.connectOrStart(function(error, daemon) {
  if(error) throw error

  daemon.listProcesses(function(error, processes) {
    // ...
  })
})
```

## Daemon methods

The `daemon` argument passed to `Local.connect` and `Local.connectOrStart` has the following methods:

### listProcesses(callback(error, processes))

Get a list of processes.

```javascript
daemon.listProcesses(function(error, processes) {
  // processes is an array of processInfo objects
})
```

### startProcess(pathOrName, options, callback(error, processInfo))

Start a process. Pass either the path to a script, the name of a stopped process or installed app.

```javascript
daemon.startProcess(pathOrName, options, function(error, processInfo) {
  // processInfo.id is the process id of the newly started process

  daemon.on('process:ready', function(error, readyProcessInfo) {
    if(processInfo.id == readyProcessInfo.id) {
      // process has now started
    }
  })
})
```

### stopProcess(id, callback(error))

Stop a process.  N.b. This method is for killing processes that have not started up properly - e.g. if it's status never gets beyond `starting`. Otherwise you should use the [kill](https://github.com/tableflip/guvnor/blob/master/docs/programmatic-access-local.md#killcallbackerror) method on it's RPC service instead.

```javascript
daemon.findProcessInfoByName(name, function(error, processInfo) {
  daemon.kill(processInfo.id, function(error) {
    // process has now been killed, if it has not finished starting,
    // otherwise `error` will be set - instead use processInfo.kill()
  })
})
```

### removeProcess(id, function(error)

Remove a stopped process

```javascript
// id is processInfo.id
daemon.removeProcess(id, function(error) {

})
```

### Find ProcessInfo by id

Every managed process is assigned an id.  This id is stable even if the process is restarted.

```javascript
// id is processInfo.id
daemon.findProcessInfoById(id, function(error, processInfo) {
  // processInfo is undefined if no process with that id existed
})
```

### Find ProcessInfo by pid

The pid of a managed process is assigned by the operating system and will change when the process is restarted.

```javascript
// pid is the pid of a managed process
daemon.findProcessInfoByPid(pid, function(error, processInfo) {
  // processInfo is undefined if no process with that pid existed
})
```

### Find ProcessInfo by name

The name of the process is either specified by the `-n` argument, it's the name of the script or it's the `name` field of an adjacent package.json file.

```javascript
// pid is the pid of a managed process
daemon.findProcessInfoByName(name, function(error, processInfo) {
  // processInfo is undefined if no process with that name existed
})
```

### deployApplication(name, url, user, onOut, onErr, callback)

```javascript
daemon.deployApplication(name, url, user, console.info, console.error, function(error, appInfo) {
  // ...
})
```

### List applications

```javascript
daemon.listApplications
```

### List applications refs

```javascript
daemon.listApplicationRefs
```

### Switch applications refs

```javascript
daemon.switchApplicationRefs
```

### Update applications refs

```javascript
daemon.updateApplicationRefs
```

### Remove application

```javascript
daemon.removeApplication
```

## Admin methods

If you are connected as a privileged user (e.g. root or the user that guvnor is configured to run as), you will have these additional methods available.


## Dump processes
```javascript
daemon.dumpProcesses
```

## Restore processes
```javascript
daemon.restoreProcesses
```

## Generate remote RPC certificates
```javascript
daemon.generateRemoteRpcCertificates
```

## kill

```javascript
daemon.kill
```

### Remote host config

```javascript
daemon.remoteHostConfig
```

### Add remote user

```javascript
daemon.addRemoteUser
```

### Remove remote user

```javascript
daemon.removeRemoteUser
```

### List remote users

```javascript
daemon.listRemoteUsers
```

### Rotate remote user keys

```javascript
daemon.rotateRemoteUserKeys
```

### Start process as user

```javascript
daemon.startProcessAsUser
```

## Process methods

### kill(callback(error))

To stop a process, first connect to the daemon, then use the daemon to connect to the process and kill it.

```javascript
// id is processInfo.id. Alternatively use findProcessInfoByName or findProcessInfoByPid
daemon.findProcessInfoById(id, function(error, managedProcess) {
  managedProcess.kill()
  managedProcess.disconnect()
})
```

### Send a process an event

Causes the global process object to emit an event in the managed process.

```javascript
// id is processInfo.id. Alternatively use findProcessInfoByName or findProcessInfoByPid
daemon.findProcessInfoById(id, function(error, managedProcess) {
  managedProcess.send('custom:event', 'arg1', 'arg2')
  managedProcess.disconnect()
})
```

In the managed process:

```javascript
process.on('custom:event', function(arg1, arg2) {
  console.info('received my custom event type with args', arg1, ar2)
})
```

Functions can be sent too (but note these are executed in the context of the sender, not the receiving process).

```javascript
// id is processInfo.id. Alternatively use findProcessInfoByName or findProcessInfoByPid
daemon.findProcessInfoById(id, function(error, managedProcess) {
  managedProcess.send('other:event', function(message) {
    console.info('remote process said', message)
    managedProcess.disconnect()
  })
})
```

In the managed process:

```javascript
process.on('other:event', function(callback) {
  callback('hello world')
})
```

### Send a process a signal

```javascript
// id is processInfo.id. Alternatively use findProcessInfoByName or findProcessInfoByPid
daemon.findProcessInfoById(id, function(error, managedProcess) {
  managedProcess.signal('SIGHUP', managedProcess.disconnect.bind(managedProcess))
})
```

In the managed process:

```javascript
process.on('SIGHUP', function() {
  // do something
});
```

### Write to stdin for a process

```javascript
// id is processInfo.id. Alternatively use findProcessInfoByName or findProcessInfoByPid
daemon.findProcessInfoById(id, function(error, managedProcess) {
  managedProcess.write('hello', managedProcess.disconnect.bind(managedProcess))
})
```

In the managed process:

```javascript
process.stdin.on('data', function(buffer) {
  // do something with buffer
});
```
