# Help

1. [Starting and stopping processes](processes.md)
1. Controlling the Daemon
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. guv-web)](remote.md)
1. [Web interface](web.md)
1. [Web interface - configuration](web-config.md)
1. [Web interface - user management](web-users.md)
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Controlling the Daemon

1. [config](#config)
1. [kill](#kill)
1. [logs](#logs)
1. [dump](#dump)
1. [restore](#restore)

## config

Prints out a configuration option

```sh
guv config <path>
```

### e.g.

```sh
$ guv config remote.inspector.enabled
// prints 'true'
```

## kill

Stop all processes and kill the daemon.  By default all currently running processes will be saved and restarted when guvnor restarts.

```sh
guv kill
```

## logs

Show live logs for a process (or all processes if `<pid>` is omitted) in the console

```sh
guv logs [pid]
```

## dump

Create `/etc/guvnor/processes.json` with a list of running processes to for use with `guv restore`

```sh
guv dump
```

## restore

Restore running processes from `/etc/guvnor/processes.json`

```sh
guv restore
```
