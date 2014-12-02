# Help

1. [Starting and stopping processes](processes.md)
1. [Controling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. Remote access and monitoring (e.g. boss-web)

## Remote access and monitoring

These commands are for use with [boss-web](http://github.com/tableflip/boss-web).

1. [remoteconfig](#remoteconfig)
1. [useradd](#useradd)
1. [rmuser](#rmuser)
1. [lsusers](#lsusers)
1. [reset](#reset)

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

## lsusers

To list users for [boss-web](http://github.com/tableflip/boss-web) - see boss-web's [setup](https://github.com/tableflip/boss-web#setup) for more information.

```sh
bs lsusers
```

## reset

To reset the secret for a [boss-web](http://github.com/tableflip/boss-web) user - see boss-web's [setup](https://github.com/tableflip/boss-web#setup) for more information.

```sh
bs reset <username>
```
