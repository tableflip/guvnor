# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. Remote access and monitoring (e.g. guv-web)
1. [Web interface](web.md)
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Remote access and monitoring

These commands are for use with [guvnor-web](web.md).

1. [remoteconfig](#remoteconfig)
1. [useradd](#useradd)
1. [rmuser](#rmuser)
1. [lsusers](#lsusers)
1. [reset](#reset)

## remoteconfig

For use with [guvnor-web](web.md).

```sh
guv remoteconfig
```

## useradd

To add a user for [guvnor-web](web.md).  If you specify `[hostname]` the configuration output is more likely to be correct.

```sh
guv useradd [options] <username> [hostname]
```

## rmuser

To remove a user for [guvnor-web](web.md).

```sh
guv rmuser <username>
```

## lsusers

To list users for [guvnor-web](web.md).

```sh
guv lsusers
```

## reset

To reset the secret for a [guvnor-web](web.md) user.

```sh
guv reset <username>
```
