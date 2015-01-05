# boss-web

A web interface for the [boss](http://github.com/tableflip/boss) node.js process manager.

Memory usage and per-core CPU load:

![hosts](img/host.png)

Process usage graphs including heap size, resident set size, CPU, etc.

![process](img/process.png)

See stack traces for the uncaught exceptions that took your app down

![exceptions](img/exceptions.png)

Live logs for your process

![logs](img/logs.png)

## Prerequisites

 1. Boss installed on one or more servers
 2. A modern web browser

## Installation

```sh
$ npm install -g boss-web
```

## Setup

Here `$CONFIG_DIR` is `/etc/boss` if you are root or `$HOME/.config/boss` if you are not.  

Unless you want it to listen on privileged ports (e.g. 80 or 443), you do not need to be root to run boss-web.

### Step 1. Create a user to log in as

```sh
$ bs-web useradd alex
```

### Step 2. On the machine Boss is running on, obtain the host config

```sh
$ sudo bs remoteconfig

Add the following to your bossweb-hosts file:

[foo-bar-com]
  host = foo.bar.com
  port = 57483
  user = root
  secret = ZD57XFx6sBz....
```

Create a file named `$CONFIG_DIR/bossweb-hosts` with the output from the `remoteconfig` command.

### Step 3. Still on the Boss machine, add a remote user

```sh
$ sudo bs useradd alex

[alex.foo-bar-com]
  secret = LsYd5UaH...
```

The file `$CONFIG_DIR/bossweb-users` should have been created during step 1 - open it and add the output from `useradd`.

### Step 3a.  Optionally override which user you connect as

If you wish to log in to boss-web as `alex`, but need to administer a process running on a remote host as `alan`, you can override the user you connect to a given server in `$CONFIG_DIR/bossweb-users`:

```sh
[alex.foo-bar-com]
  user = alan
  secret = LsYd5UaH...
```

### Step 4. Start boss-web

```sh
$ bs-web
```

## Running boss-web with boss

Ouroboros style:

```sh
$ bs start /usr/local/lib/node_modules/boss-web
```

## Every time I restart boss-web I have to re-accept a self-signed certificate!

[Let's Encrypt](https://letsencrypt.org/) still future tech?  Generate a 30 day self-signed certificate with:

```sh
$ bs-web genssl 30
```

If the number of days is omitted it defaults to one year.

Alternatively if you've bought an SSL certificate, configure boss-web according to the comments in the `[https]` section of the [default configuration](./bossweb) file.

## More information

 * [Config files](CONFIG.md)
 * [User management](USERS.md)
