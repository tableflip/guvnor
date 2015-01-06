# Help

1. Starting and stopping processes
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

## Starting and stopping processes

 1. [start](#start)
 1. [restart](#restart)
 1. [stop](#stop)
 1. [list](#list)
 1. [heapdump](#heapdump)
 1. [gc](#gc)
 1. [signal](#signal)
 1. [send](#send)

## start

```sh
bs start [options] <script>
```

Start a new process.

### args

```
-h, --help                   output usage information
-u, --user <user>            The user to start a process as
-g, --group <group>          The group to start a process as
-i, --instances <instances>  How many instances of the process to start (e.g. cluster mode)
-n, --name <name>            What name to give the process
-a, --argv <argv>            A space separated list of arguments to pass to a process
-e, --execArgv <execArgv>    A space separated list of arguments to pass to the node executable
-d, --debug                  Pause the process at the start of execution and wait for a debugger to be attached
-v, --verbose                Prints detailed internal logging output
```

### e.g.

To start `http-server.js` as a cluster with two workers, running as `alex:staff` and with two command line arguments `-a foo` and `-b bar`

```
$ bs start -u alex -g staff -i 2 -argv '-a foo -b bar' http-server.js
```

## restart

Restart a running process

```sh
bs restart <pid>
```

## stop

Stop a running process.

```sh
bs stop <pid>
```

## list

```sh
bs list
```

Display a list of processes boss has started.

## send

Send an event to a process

```sh
bs send <pid> <event> [args...]
```

### e.g.

In my script

```javascript
process.on('my:custom:event', function(arg1, arg2) {
  console.info(arg1 + arg2)
})
```

```
$ bs send 39823 my:custom:event 1 2
// process 39823 then prints '3' to the logs
```

## heapdump

Make a process dump a heap snapshot for analysis in Chrome's debug tools.  The file will appear at `process.cwd`

```sh
bs heapdump <pid>
```

## gc

Force a process to do garbage collection

```sh
bs gc <pid>
```

## signal

Send a signal to a process (n.b. unless you have a listener for that signal, your process will most likely exit)

```sh
bs signal <pid> <signal>
```

### e.g.

```sh
$ bs signal 3984 SIGINT
```
