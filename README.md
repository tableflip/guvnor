<img src="https://raw.github.com/tableflip/boss/master/img/boss.png" alt="Control your processes like a boss" width="20%"/>

boss [![Build Status](https://travis-ci.org/tableflip/boss.svg)](https://travis-ci.org/tableflip/boss) [![Dependency Status](https://david-dm.org/tableflip/boss.svg?theme=shields.io)](https://david-dm.org/tableflip/boss) [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss/master.svg)](https://coveralls.io/r/tableflip/boss)
====

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
	socket = /var/run/boss/bs
	infolog = /var/log/boss/boss-info.log
	errorlog = /var/log/boss/boss-error.log

[logging]
	directory = /var/log/boss
```

It means that the user/group you run boss as must have write access to `/var/run` and `/var/log`.

* * *

Discuss: [gitter.im/tableflip/boss](https://gitter.im/tableflip/boss)
