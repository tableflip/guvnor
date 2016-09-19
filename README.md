<img src="./img/guvnor.png" alt="Control your processes like a boss" width="20%"/>

# The Guvnor

[![Discuss](http://img.shields.io/badge/discuss-gitter-brightgreen.svg?style=flat)](https://gitter.im/tableflip/guvnor/discuss) [![Tasks](http://img.shields.io/badge/tasks-waffle-brightgreen.svg?style=flat)](https://waffle.io/tableflip/guvnor) [![Build Status](https://travis-ci.org/tableflip/guvnor.svg)](https://travis-ci.org/tableflip/guvnor) [![Dependency Status](https://david-dm.org/tableflip/guvnor.svg)](https://david-dm.org/tableflip/guvnor) [![Coverage Status](https://img.shields.io/coveralls/tableflip/guvnor/master.svg?style=flat)](https://coveralls.io/r/tableflip/guvnor)

> Noun 1. guvnor - (British slang) boss

A node process manager that wraps your platform's process manager (e.g. systemd, launchd, etc) and adds process monitoring & statistics with a neat web monitor.

### Why?

Most node process managers spawn detached child processes to run your scripts either from node or a native module. This means that if the process manager dies or otherwise crashes, your process either goes with it or becomes a zombie process, neither of which are good places to be.

Most operating systems already provide mechanisms for running long-lived processes - systemd on Linux, launchd on Mac OS X, etc.  Processes spawned by these systems are owned by the kernel so do not have the same problem.

## Features

* Monitoring via console or web
* Configure user/group to run processes as
* Auto process restart on crash
* Log redirection to per process out/err files
* Cluster support
* Monitor process CPU/memory/event loop latency
* Remotely trigger GC/heap dump
* Debug remote processes
* Store exception stack traces and logs for post-crash analysis

## Command line interface

![cli](img/cli.png)

Use `guv` (or `guvnor` if you're not into the whole brevity thing).

## Web interface

Start the web interface under guvnor:

```sh
$ guv web
```

![guvnor-web](img/host.png)

## Install

```sh
npm install -g guvnor --unsafe-perm
```

Why `--unsafe-perm`? Guvnor uses a fair few native modules that require access to `/root/.npm` and `/root/.node-gyp` when building. At the moment this is the only way to allow access.

## Upgrading

npm's upgrade command is [a big angry box of wasps](https://github.com/npm/npm/issues/6247#issuecomment-63022163) so to be sure, kill guvnor, remove it, reinstall and start it.

```sh
guv kill
npm remove -g guvnor
npm install -g guvnor
guv list
```

For instructions on how to move between breaking versions, see [upgrading](UPGRADING.md)

## Usage

Comprehensive help is available on the command line:

```sh
guv --help
```

and with more detail for each subcommand, e.g.:

```
guv start --help
```

The first time you invoke a guvnor command, the daemon will start in the background.  Because guvnor can run processes as different users, it needs to be able to switch to those users.  Consequently you should start guvnor as root or another privileged user.

## Help

1. [Starting and stopping processes](docs/processes.md)
1. [Controlling the Daemon](docs/daemon.md)
1. [Managing clusters](docs/clusters.md)
1. [Installing and running apps](docs/apps.md)
1. [Remote access and monitoring (e.g. guvnor-web)](docs/remote.md)
1. [Web interface](docs/web.md)
1. [Web interface - configuration](docs/web-config.md)
1. [Web interface - user management](docs/web-uesrs.md)
1. [Programmatic access](docs/programmatic-access.md)
1. [Programmatic access - local](docs/programmatic-access-local.md)
1. [Programmatic access - remote](docs/programmatic-access-remote.md)
1. [Programmatic access - events](docs/programmatic-access-events.md)

Configure
---

A configuration file if run as root can be placed at `/etc/guvnor/guvnor`. Take a look at the [default configuration file](guvnor) for details.

If you create a configuration file, it will be merged with the default configuration, so if you only want to override one property, you need only specify one property in your config file.

## Starting guvnor on boot

Guvnor comes with a sysv init script.  To configure it to run on system boot run the following:

```sh
$ sudo ln -s /usr/local/lib/node_modules/guvnor/scripts/init/sysv/guvnor /etc/init.d/guvnor
$ sudo update-rc.d guvnor defaults
```

To undo this, run:

```sh
$ sudo update-rc.d guvnor remove
$ sudo rm /etc/init.d/guvnor
```

## apt-get

If you installed node via `apt-get install nodejs`, you should create a symlink to the `nodejs` binary:

```sh
$ sudo ln -s /usr/bin/nodejs /usr/bin/node
```

Also, the init script is probably stored at `/usr/lib/node_modules/...` instead of `/usr/local/lib/node_modules/...` - please check your filesystem to be sure.

## Docker

See the sample [Dockerfile](docker/Dockerfile) for how to run guvnor with Docker.

In the Dockerfile there are two variables - `GUVNOR_ROOT_SECRET` and `GUVNOR_USER_SECRET` - you should change these to a long random string unique to your install before building the container.

Once you'd done that, build the container and run it with the commands below.  The `-p` option forwards a port used by guv-web to connect to the instance of guvnor in the container, so forward the port as appropriate to your setup.

```
$ sudo docker build -t guvnor .
$ sudo docker run -p 57484:57483 -d guvnor
```

To connect guv-web to your docker container, add something like the below to your `guvnor-web-hosts` file:

```
[docker]
  host = localhost
  port = 57484
  user = root
  secret = GUVNOR_ROOT_SECRET
```

...and to your `guvnor-web-users` file:

```
[alex.docker]
  user = guvnor
  secret = GUVNOR_USER_SECRET
```

Replace `GUVNOR_ROOT_SECRET` and `GUVNOR_USER_SECRET` with whatever you defined in the Dockerfile.

## Development

### Integration tests

```
$ vagrant plugin install vagrant-port
```

### Vagrant setup

It's useful to be able to set up and tear down fresh VMs to do testing, so a Vagrant file is available. It's configured to run Debian Jessie and install the latest versions of Node and Guvnor.

Once Vagrant is installed, cd into the vagrant directory and run:

```sh
$ vagrant up
$ vagrant ssh
$ sudo npm install -g guvnor
```

Then when you are done, to shut the machine down exit your SSH session and run:

```sh
$ vagrant destroy
```

#### Docker

Install docker on vagrant with

```
wget -qO- https://get.docker.com/ | sh
```

Then cd to `/docker` and build & run guvnor

```
sudo docker build -t guvnor .
sudo docker run -p 60000-60020:60000-60020 -d guvnor
```

## Changelog

See the [changelog](CHANGELOG.md)
