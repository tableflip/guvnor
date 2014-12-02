# Help

1. [Starting and stopping processes](processes.md)
1. [Controling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. Installing and running apps
1. [Remote access and monitoring (e.g. boss-web)](remote.md)

## Installing and running apps

boss lets you deploy applications directly from git repositories.

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

To add an application to boss' application list:

```sh
bs install <name> <url>
```

### e.g.

```sh
$ bs install my-hot-app https://github.com/achingbrain/http-test.git
```

## list

To show apps that have been installed

```
bs lsapps
```

### e.g.

```sh
$ bs lsapps
Name   User   URL
foo    alex   https://github.com/achingbrain/http-test.git
```

The URL can be anything that `git clone` can resolve - github, bitbucket, smb shares, local paths, etc.

## remove

To remove a previously installed app.

```sh
bs rmapp <name>
```

## start, stop, restart, etc

Once installed, use `bs start` to start your app, but pass the name of the app instead of the pid.

```sh
bs start my-hot-app
```

Once your app is running, use the normal commands to manage your app, using the pid or the app name.

## versions

By default boss will deploy the HEAD of master.  To deploy other refs use `setref`

```sh
bs setref <appName> <ref>
```

### e.g.

```sh
bs setref my-hot-app tags/v137
```

## list versions

To see which refs are available, use `lsrefs`

```sh
bs lsrefs <appName>
```

### e.g.

```sh
$ bs lsrefs my-hot-app
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
bs updaterefs <appName>
```

### e.g.

```sh
$ bs updaterefs my-hot-app
```
