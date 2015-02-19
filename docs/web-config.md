# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. guv-web)](remote.md)
1. [Web interface](web.md)
1. Web interface - configuration
1. [Web interface - user management](web-users.md)
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Config files

Depending on who is running guvnor-web, the three configuration files (`guvnor-web`, `guvnor-web-hosts` and `guvnor-web-users`) should be placed in one of the following directories:

 * Normal user - `$HOME/.config/guvnor`
 * Root user - `/etc/guvnor`

The config files contain sensitive information so should have appropriate permissions applied to them, i.e. `0600`.

Changing values in configuration files will override the defaults supplied with the app.

### guvnor-web

`guvnor-web` contains various preferences and settings for the web server and user interface.

See the [default configuration file](./guvnor-web) for discussion on the various options.

The only one that is required for you to change is `${salt}`.  Do this by running:

```sh
$ guv-web gensalt
```

A minimal `guvnor-web` file looks like this:

```sh
$ cat ~/.config/guvnor/guvnor-web

salt=sjfoj0ewoijssd
```

### guvnor-web-hosts

This file contains the hosts you wish to monitor.

A sample `guvnor-web-hosts` file might look like:

```
$ cat ~/.config/guvnor/guvnor-web-hosts

[webserver]
  host = www.foo.com
  port = 57483
  user = root
  secret = ZD57XFx6sBz....

[database]
  host = db.foo.com
  port = 57483
  user = root
  secret = dr37sFh8kBl....
```

Here, two hosts are configured, `webserver` and `database`.  The host names in square brackets can be anything you like but cannot contain `.` characters.

To configure a host, run the `remoteconfig` subcommand on the guvnor server you wish to monitor:

```sh
$ sudo guv remoteconfig

Add the following to your guvnor-web-hosts file:

[foo-bar-com]
  host = foo.bar.com
  port = 57483
  user = root
  secret = ZD57XFx6sBz....
```

#### mDNS

If you are on the same network as the host you wish to monitor, you may omit the `host` and `port` arguments.  guvnor will advertise it's presence via mDNS (unless `${remote.advertise}` is set to false).

### guvnor-web-users

This file contains users who can log in to Guvnor Web and which servers they can see/interact with.

A sample `guvnor-web-users` file might look like:

```
$ cat ~/.config/guvnor/guvnor-web-users

[alex]
  password = foo

[alex.webserver]
  secret = b337sFd85B3....

[alan]
  password = bar

[alan.webserver]
  secret = 73574F38dBd....

[alan.database]
  secret = 7a4g47g85B3....
```

Here there are two users - `alex` and `alan`.  `alan` has access to both the `webserver` and `database` hosts but `alex` can only access the `webserver` host.
