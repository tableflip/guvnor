# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. boss-web)](remote.md)
1. [Web interface](web.md)
1. [Web interface - configuration](web-config.md)
1. Web interface - user management
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## User administration

These commands administer users on a `boss-web` instance and will update your `bossweb` and `bossweb-users` config files.

For the time being `boss-web` must not be running while you do this.

### Adding users

```sh
bs-web useradd alex
```

### Removing users

```sh
bs-web rmuser alex
```

### Resetting passwords

```sh
bs-web passwd alex
```

### Listing users

```sh
bs-web lsusers
```

### Changing the password salt

N.b. this will invalidate all user passwords, so don't forget to reset them otherwise no-one will be able to log in!

```sh
bs-web gensalt
```
