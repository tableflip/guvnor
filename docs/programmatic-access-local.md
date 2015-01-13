# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. boss-web)](remote.md)
1. [Web interface](web.md)
1. [Web interface - configuration](web-config.md)
1. [Web interface - user management](web-users.md)
1. [Programmatic access](programmatic-access.md)
1. Programmatic access - local
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Programmatic access - local

A interface to an instance of [boss](http://github.com/tableflip/boss) running on the same host.

## Usage

Local boss instance (e.g. on the same server). If the daemon cannot be reached it will be started.

N.b. the daemon will drop to the user account specified in the config file so please ensure you have sufficient privileges to do this.

```javascript
var connect = require('process-boss').Local.connect,
  config = {
    boss: {
      rundir: '/var/run/boss',
      logdir: '/var/log/boss',
      timeout: 10000
    },
    debug: {
      daemon: false,
      cluster: false
    }
  }

connect(config, function(error, boss) {
  // we are now connected to local boss instance

  boss.listProcesses(function(error, processes) {
    // do something

    // close connection
    boss.disconnect()
  })
})
```
N.b. If you fail to close the connection to the daemon, your program will probably not exit.

### Is Boss running?

Sometimes you don't want to start the daemon, you'd just like to know if boss is running on the current host or not.

```javascript
var running = require('process-boss').Local.running
  config = {
      boss: {
        rundir: '/var/run/boss',
        logdir: '/var/log/boss',
        timeout: 10000
      },
      debug: {
        daemon: false,
        cluster: false
      }
    }

running(config, function(isRunning) {
  if(isRunning) {
    console.info('boss is running')
  } else {
    console.info('boss is not running')
  }
}
```

## Logging

By default boss will log messages to the console.  If you wish to pass these somewhere else (or ignore them entirely, pass an additional object in to the connect function with four properties - `info`, `warn`, `error`, `debug`.

```javascript
var connect = require('boss-local').connect,
  config = {
    boss: {
    rundir: '/var/run/boss',
    logdir: '/var/log/boss',
    timeout: 10000
  },
  debug: {
    daemon: false,
    cluster: false
  },
  logger = {
    info: function() {},
    warn: function() {},
    error: function() {},
    debug: function() {}
  }

connect(config, logger, function(error, boss) {
  // we are now connected to the boss instance
  ...
})
```

If you are making lots of connections, for convenience you may wish to bind these arguments to the function:

```javascript
var connect = require('process-boss').Local.connect,
  connect = connect.bind(null, {
    boss: {
      rundir: '/var/run/boss',
      logdir: '/var/log/boss',
      timeout: 10000
    },
    debug: {
      daemon: false,
      cluster: false
    }
  }, {
     info: function() {},
     warn: function() {},
     error: function() {},
     debug: function() {}
    }
  )

connect(function(error, boss) {
  // we are now connected to the boss instance
  ...
})

```

## Methods


### List

Get a list of currently running processes

```javascript
boss.listProcesses(function(error, processes) {
  // processes is an array of processInfo objects
})
```

### Start

Start a process

```javascript
boss.startProcess(path, opts, function(error, processInfo) {
  // processInfo.id is the process id of the newly started process
  
  boss.on('process:ready:' + processInfo.id, function(error, processInfo) {
    // process has now started
  })
})
```

### Stop

Stop a process

```javascript
// id is processInfo.id
boss.connectToProcess(id, function(error, managedProcess) {
  managedProcess.kill()
  managedProcess.disconnect()
})
```

### Send a process an event

Causes the global process object to emit an event in the managed process.

```javascript
// id is processInfo.id
boss.connectToProcess(id, function(error, managedProcess) {
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
// id is processInfo.id
boss.connectToProcess(id, function(error, managedProcess) {
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

### Find ProcessInfo by id

Every managed process is assigned an id by boss.  This id is stable even if the process is restarted.

```javascript
// id is processInfo.id
boss.findProcessInfoById(id, function(error, processInfo) {
  // processInfo is undefined if no process with that id existed
})
```

### Find ProcessInfo by pid

The pid of a managed process is assigned by the operating system and will change when the process is restarted.

```javascript
// pid is the pid of a managed process
boss.findProcessInfoByPid(pid, function(error, processInfo) {
  // processInfo is undefined if no process with that pid existed
})
```
