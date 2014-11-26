<img src="https://raw.github.com/tableflip/boss/master/img/boss.png" alt="Control your processes like a boss" width="20%"/>

# boss

[![Discuss](http://img.shields.io/badge/discuss-gitter-brightgreen.svg)](https://gitter.im/tableflip/boss) [![Build Status](https://travis-ci.org/tableflip/boss.svg)](https://travis-ci.org/tableflip/boss) [![Dependency Status](https://david-dm.org/tableflip/boss.svg)](https://david-dm.org/tableflip/boss)

A node process manager that isn't spanners all the way down.

## Features

* Monitoring in console
* Configure user/group to run processes as
* Auto process restart on crash
* Log redirection to per process out/err files
* [Web interface](http://github.com/tableflip/boss-web) with support for monitoring multiple hosts
* Cluster support

## Install

```sh
npm install -g process-boss
```

## Usage

Comprehensive help is available on the command line:

```sh
bs --help
```

and with more detail for each subcommand, e.g.:

```
bs start --help
```

The first time you invoke a boss command, the daemon will start in the background.  Because boss can run processes as different users, it needs to be able to switch to those users.  Consequently you should run boss as root or another privileged user.

## list

```sh
bs list
```

Display a list of processes boss has started.

## start

```sh
bs start [options] <script>
```

Start a new process.

#### args

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

#### e.g.

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

## kill

Stop all processes and kill the daemon.  By default all currently running processes will be saved and restarted when boss restarts.

```sh
bs kill
```

## cluster

After starting a process with `-i $num` (e.g. start ``$num` instances of a script), adjust the number of cluster workers.

```sh
bs cluster <pid> <workers>
```

### e.g.

Make process 49308 (previously started with `-i 2`) run with 4 workers:

```sh
$ bs cluster 49308 4
```

The maximum workers you can set is dependent on your system as `num_cpus - 1`

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

## logs

Show live logs for a process (or all processes if `<pid>` is omitted) in the console

```sh
bs logs [pid]
```

## dump

Create `/etc/boss/processes.json` with a list of running processes to for use with `bs restore`

```sh
bs dump
```

## restore

Restore running processes from `/etc/boss/processes.json`

```sh
bs restore
```

## remoteconfig

For use with [boss-web](http://github.com/tableflip/boss-web) - see boss-web's [setup](https://github.com/tableflip/boss-web#setup) for more information

```sh
bs remoteconfig
```

## useradd

To add a user for [boss-web](http://github.com/tableflip/boss-web) - see boss-web's [setup](https://github.com/tableflip/boss-web#setup) for more information.  If you specify `[hostname]` the configuration output is more likely to be correct.

```sh
bs useradd [options] <username> [hostname]
```

## rmuser

To remove a user for [boss-web](http://github.com/tableflip/boss-web) - see boss-web's [setup](https://github.com/tableflip/boss-web#setup) for more information.

```sh
bs rmuser <username>
```

## lsuser

To list users for [boss-web](http://github.com/tableflip/boss-web) - see boss-web's [setup](https://github.com/tableflip/boss-web#setup) for more information.

```sh
bs lsusers
```

## reset

To reset the secret for a [boss-web](http://github.com/tableflip/boss-web) user - see boss-web's [setup](https://github.com/tableflip/boss-web#setup) for more information.

```sh
bs reset <username>
```

## config

Prints out a configuration option

```sh
bs config <path>
```

### e.g.

```sh
$ bs config remote.inspector.enabled
// prints 'true'
```

Configure
---

A configuration file if run as root can be placed at `/etc/boss/bossrc`. The  [default config file](bossrc) is below.

If you create a configuration file, it will be merged with the default configuration, so if you only want to override one property, you need only specify one property in your config file.

```sh
[boss]
  ; The user the daemon will run as - this user should have sufficient
  ; privileges to spawn new processes and then drop their privileges to
  ; that of other users
  user = root

  ; The group the daemon will run as - if you wish to interact with boss
  ; you should be in this group
  group = staff

  ; Where boss puts log files. Will be created on first run.
  logdir = /var/log/boss

  ; Where the dnode sockets are stored. Will be created on first run.
  rundir = /var/run/boss

  ; Where remote user configuration is stored - should only be accessible
  ; to ${boss.user}
  confdir = /etc/boss

  ; How long we should wait for remote processes to respond
  timeout = 10000

  ; If true, when boss is killed it will dump process info to
  ; ${boss.rundir}/processes.json then, the next time it is started, read
  ; that file in and restart those processes
  autoresume = true

[remote]
  ; If true, Boss will start an https server on ${remote.host}:${remote.port}
  ; to listen for incoming boss-remote connections
  enabled = true

  ; The port Boss will listen on for incoming boss-remote connections
  port = 57483

  ; The host Boss will list on for incoming boss-remote connections
  host = 0.0.0.0

[remote.inspector]
  ; If true, Boss will start an instance of node-inspector in order to debug
  ; processes running on this host
  enabled = true

  ; The port to use for the instance of node-inspector
  port = 0

  ; The host to listen on for the instance of node-inspector
  host = 0.0.0.0

[debug]
  ; Three possible options:
  ;
  ;   1. boolean - false (default) - the daemon process will run as normal
  ;   2. boolean - true - the daemon process will choose a random port and
  ;      wait for a debugger to connect to it
  ;   3. int - the daemon will pause on startup and wait for a debugger to
  ;      connect to the specified port
  ;
  ; n.b. if you change this option you will need to kill and restart the
  ; daemon for it to take effect.

  ; Unless you are debugging Boss itself, you probably want to leave this
  ; as false.
  daemon = false

  ; If true, cluster managers will be started in debug mode when the -d
  ; flag is passed when starting a clustered process, otherwise just the
  ; cluster workers will be started in debug mode.  Unless you are debugging
  ; Boss itself, you probably want to leave this as false.
  cluster = false

```

See the [default config file](bossrc) for more information on the various options.

## Starting boss on boot

Boss comes with a sysv init script.  To configure it to run on system boot run the following:

```sh
$ sudo ln -s /usr/local/lib/node_modules/process-boss/scripts/init/sysv/boss /etc/init.d/boss
$ sudo update-rc.d boss defaults
```

To undo this, run:

```sh
$ sudo update-rc.d boss remove
$ sudo rm /etc/init.d/boss
```

* * *

Discuss: [gitter.im/tableflip/boss](https://gitter.im/tableflip/boss)
