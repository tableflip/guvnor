# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. guv-web)](remote.md)
1. Web interface
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## guvnor-web

A web interface for the [guvnor](http://github.com/tableflip/guvnor) node.js process manager.

Memory usage and per-core CPU load:

![hosts](../img/host.png)

Process usage graphs including heap size, resident set size, CPU, event loop latency, etc.

![process](../img/process.png)

See stack traces for the uncaught exceptions that took your app down

![exceptions](../img/exceptions.png)

Live logs for your process

![logs](../img/logs.png)

### Prerequisites

 1. Guvnor installed on one or more servers
 2. A modern web browser

### Setup

Here `$CONFIG_DIR` is `/etc/guvnor` if you are root or `$HOME/.config/guvnor` if you are not.  

Unless you want it to listen on privileged ports (e.g. 80 or 443), you do not need to be root to run guvnor-web.


#### Step 1. On the machine Guvnor is running on, obtain a PKCS12 key bundle for the user you wish to connect as

If you've not yet added the user, do it now (as root):

```sh
$ sudo guv useradd alex
```

Then as the user you wish to connect as, create the key bundle.

```sh
$ guv keybundle alex -p password
Created user key bundle at /home/alex/alex.p12
Created Guvnor CA Certificate at /home/alex/guvnor.crt
```

#### Step 2. Import the key bundle and CA certificate into your browser

##### Firefox (any OS)

Preferences > Advanced > Certificates > View Certificates > Your Certificates > Import
Preferences > Advanced > Certificates > View Certificates > Authorities > Import

##### Chrome/Safari (Mac OS X)

##### Chrome/Internet Explorer (Windows)

#### Step 3. Start the web interface

N.b. It's not necessary to run the web interface as root.

```sh
$ guv web
```
