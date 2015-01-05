### Config files

Depending on who is running boss-web, the three configuration files (`bossweb`, `bossweb-hosts` and `bossweb-users`) should be placed in one of the following directories:

 * Normal user - `$HOME/.config/boss`
 * Root user - `/etc/boss`

The config files contain sensitive information so should have appropriate permissions applied to them, i.e. `0600`.

Changing values in configuration files will override the defaults supplied with the app.

### bossweb

`bossweb` contains various preferences and settings for the web server and user interface.

See the [default configuration file](./bossweb) for discussion on the various options.

The only one that is required for you to change is `${salt}`.  Do this by running:

```sh
$ bs-web gensalt
```

A minimal `bossweb` file looks like this:

```sh
$ cat ~/.config/boss/bossweb

salt=sjfoj0ewoijssd
```

### bossweb-hosts

This file contains the hosts you wish to monitor.

A sample `bossweb-hosts` file might look like:

```
$ cat ~/.config/boss/bossweb-hosts

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

To configure a host, run the `remoteconfig` subcommand on the boss server you wish to monitor:

```sh
$ sudo bs remoteconfig

Add the following to your bossweb-hosts file:

[foo-bar-com]
  host = foo.bar.com
  port = 57483
  user = root
  secret = ZD57XFx6sBz....
```

### bossweb-users

This file contains users who can log in to Boss Web and which servers they can see/interact with.

A sample `bossweb-users` file might look like:

```
$ cat ~/.config/boss/bossweb-users

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
