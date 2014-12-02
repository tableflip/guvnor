<img src="https://raw.github.com/tableflip/boss/master/img/boss.png" alt="Control your processes like a boss" width="20%"/>

# boss

[![Discuss](http://img.shields.io/badge/discuss-gitter-brightgreen.svg)](https://gitter.im/tableflip/boss/discuss) [![Build Status](https://travis-ci.org/tableflip/boss.svg)](https://travis-ci.org/tableflip/boss)

A node process manager that isn't spanners all the way down.

## Features

* Monitoring in console
* Configure user/group to run processes as
* Auto process restart on crash
* Log redirection to per process out/err files
* Cluster support

## Command line interface

![cli](img/cli.png)

## Web interface

After you've installed boss, install [boss-web](github.com/tableflip/boss-web):

![boss-web](https://raw.githubusercontent.com/tableflip/boss-web/master/img/host.png)

## Install

```sh
npm install -g process-boss
```

## Upgrading

npm's upgrade command is [a big angry box of wasps](https://github.com/npm/npm/issues/6247#issuecomment-63022163) so to be sure, kill boss, remove it, reinstall and start it.

```sh
bs kill
npm remove -g process-boss
npm install -g process-boss
bs
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

The first time you invoke a boss command, the daemon will start in the background.  Because boss can run processes as different users, it needs to be able to switch to those users.  Consequently you should start boss as root or another privileged user.

## Help

1. [Starting and stopping processes](docs/processes.md)
1. [Controling the Daemon](docs/daemon.md)
1. [Managing clusters](docs/clusters.md)
1. [Installing and running apps](docs/apps.md)
1. [Remote access and monitoring (e.g. boss-web)](docs/remote.md)

Configure
---

A configuration file if run as root can be placed at `/etc/boss/bossrc`. Take a look at the [default configuration file](bossrc) for details.

If you create a configuration file, it will be merged with the default configuration, so if you only want to override one property, you need only specify one property in your config file.

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

## apt-get

If you installed node via `apt-get install nodejs`, you should create a symlink from the `nodejs` binary for this to work.

```sh
# ln -s /usr/bin/nodejs /usr/bin/node
```

Also, the init script is probably stored at `/usr/lib/node_modules/...` instead of `/usr/local/lib/node_modules/...`

## Components

| Name | Build status | Dependencies | Coverage |
|------|--------------|--------------|----------|
| boss-cli | [![Build Status](https://travis-ci.org/tableflip/boss.svg)](https://travis-ci.org/tableflip/boss) | [![Dependency Status](https://david-dm.org/tableflip/boss.svg)](https://david-dm.org/tableflip/boss) | [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss/master.svg)](https://coveralls.io/r/tableflip/boss) |
| boss-common | [![Build Status](https://travis-ci.org/tableflip/boss-common.svg)](https://travis-ci.org/tableflip/boss-common) | [![Dependency Status](https://david-dm.org/tableflip/boss-common.svg)](https://david-dm.org/tableflip/boss-common) | [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss-common/master.svg)](https://coveralls.io/r/tableflip/boss-common) |
| boss-daemon | [![Build Status](https://travis-ci.org/tableflip/boss-daemon.svg)](https://travis-ci.org/tableflip/boss-daemon) | [![Dependency Status](https://david-dm.org/tableflip/boss-daemon.svg)](https://david-dm.org/tableflip/boss-daemon) | [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss-daemon/master.svg)](https://coveralls.io/r/tableflip/boss-daemon) |
| boss-local | [![Build Status](https://travis-ci.org/tableflip/boss-local.svg)](https://travis-ci.org/tableflip/boss-local) | [![Dependency Status](https://david-dm.org/tableflip/boss-local.svg)](https://david-dm.org/tableflip/boss-local) | [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss-local/master.svg)](https://coveralls.io/r/tableflip/boss-local) |
| boss-remote | [![Build Status](https://travis-ci.org/tableflip/boss-remote.svg)](https://travis-ci.org/tableflip/boss-remote) | [![Dependency Status](https://david-dm.org/tableflip/boss-remote.svg)](https://david-dm.org/tableflip/boss-remote) | [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss-remote/master.svg)](https://coveralls.io/r/tableflip/boss-remote) |
| boss-web | [![Build Status](https://travis-ci.org/tableflip/boss-web.svg)](https://travis-ci.org/tableflip/boss-web) | [![Dependency Status](https://david-dm.org/tableflip/boss-web.svg)](https://david-dm.org/tableflip/boss-web) | [![Coverage Status](https://img.shields.io/coveralls/tableflip/boss-web/master.svg)](https://coveralls.io/r/tableflip/boss-web) |
