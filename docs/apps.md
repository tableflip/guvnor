# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. Installing and running apps
1. [Remote access and monitoring (e.g. guv-web)](remote.md)
1. [Web interface](web.md)
1. [Web interface - configuration](web-config.md)
1. [Web interface - user management](web-users.md)
1. [Programmatic access](programmatic-access.md)
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Installing and running apps

guvnor lets you deploy applications directly from git repositories.

In order to do this, your application must follow npm conventions.  E.g. the root of your repository will contain a `package.json` file and either an `index.js` file or the `package.json` file will have a `main` field.

Your `npm` managed dependencies will be installed after the `install` and `setref` commands are executed.

1. [install](#install)
1. [list](#list)
1. [remove](#remove)
1. [start, stop, restart, etc](#start-stop-restart-etc)
1. [versions](#versions)
1. [list versions](#list-versions)
1. [update versions](#update-versions)

## install

To add an application to guvnor's application list:

```sh
guv install <url> [name]
```

### e.g.

```sh
$ guv install https://github.com/achingbrain/http-test.git my-hot-app
```

The app name is optional - if you omit it, it will be read from package.json.

## list

To show apps that have been installed

```
guv lsapps
```

### e.g.

```sh
$ guv lsapps
Name   User   URL
foo    alex   https://github.com/achingbrain/http-test.git
```

The URL can be anything that `git clone` can resolve - github, bitbucket, smb shares, local paths, etc.

## remove

To remove a previously installed app.

```sh
guv rmapp <name>
```

## start, stop, restart, etc

Once installed, use `guv start` to start your app, but pass the name of the app instead of the pid.

```sh
guv start my-hot-app
```

Once your app is running, use the normal commands to manage your app, using the pid or the app name.

## versions

By default guvnor will deploy the HEAD of master.  To deploy other refs use `setref`

```sh
guv setref <appName> <ref>
```

### e.g.

```sh
guv setref my-hot-app tags/v137
```

## list versions

To see which refs are available, use `lsrefs`

```sh
guv lsrefs <appName>
```

### e.g.

```sh
$ guv lsrefs my-hot-app
Name                       Commit
refs/heads/master          a548a13a1a456aeb817ebb6c55d4312d62273aa6
refs/remotes/origin/HEAD   a548a13a1a456aeb817ebb6c55d4312d62273aa6
refs/remotes/origin/master a548a13a1a456aeb817ebb6c55d4312d62273aa6
refs/tags/1.0              1848ef354377f958a68445b8ec18f0d1611069d4
refs/tags/2.0              20d882056e9df15a43d67697c382dd3c8c440047
refs/tags/3.0              a548a13a1a456aeb817ebb6c55d4312d62273aa6
```

## update versions

If you are missing a ref, use the `updaterefs` command to fetch the latest history from the upstream repository.

```sh
guv updaterefs <appName>
```

### e.g.

```sh
$ guv updaterefs my-hot-app
```
