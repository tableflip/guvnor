<img src="https://raw.github.com/tableflip/boss/master/img/boss.png" alt="Control your processes like a boss" width="20%"/>

boss
====

[![Discuss](http://img.shields.io/badge/discuss-gitter-brightgreen.svg)](https://gitter.im/tableflip/boss/discuss) [![Build Status](https://travis-ci.org/tableflip/boss-cli.svg)](https://travis-ci.org/tableflip/boss-cli) [![Dependency Status](https://david-dm.org/tableflip/boss-cli.svg?theme=shields.io)](https://david-dm.org/tableflip/boss-cli) [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss-cli/master.svg)](https://coveralls.io/r/tableflip/boss-cli)

A node process manager that isn't spanners all the way down.


Features
---
* Monitoring in console
* Configure user/group to run processes as
* Auto process restart on crash
* Log redirection to per process out/err files

Install
---

```sh
npm install -g process-boss
```

Usage
---

### list

```sh
bs list
```

Display a list of processes boss has started.

### start

```sh
bs start /path/to/script.js
```

Start a new process.

#### args

- `-u` `--user` The user to start a process as
- `-g` `--group` The group to start a process as
- `-n` `--name` A name for the process

### stop

```sh
bs stop [pid]
```

Stop a running process.

### kill

```sh
bs kill
```

Stop all processes and kill the daemon.

Configure
---

Boss uses [rc](https://www.npmjs.org/package/rc) so it looks for configuration files in [sensible places](https://github.com/dominictarr/rc#standards). The default configuration file looks like:

```
[boss]
  user = root
  group = staff
  logdir = /var/log/boss
  rundir = /var/run/boss
  timeout = 10000

[debug]
  daemon = 5858
  cluster = false
```

See the [default config file](bossrc) for more information on the various options.

* * *

Discuss: [gitter.im/tableflip/boss](https://gitter.im/tableflip/boss)
