<img src="https://raw.github.com/tableflip/boss/master/img/boss.png" alt="Control your processes like a boss" width="20%"/>

boss [![Build Status](https://travis-ci.org/tableflip/boss.svg)](https://travis-ci.org/tableflip/boss) [![Dependency Status](https://david-dm.org/tableflip/boss.svg?theme=shields.io)](https://david-dm.org/tableflip/boss) [![Coverage Status](http://img.shields.io/coveralls/tableflip/boss/master.svg)](https://coveralls.io/r/tableflip/boss)
====

A node process manager that isn't spanners all the way down.

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

* * *

Discuss: [gitter.im/tableflip/boss](https://gitter.im/tableflip/boss)
