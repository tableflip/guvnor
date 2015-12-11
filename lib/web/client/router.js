var App = require('ampersand-app')
var Router = require('ampersand-router')
var HostPage = require('./views/host')
var HostAppsPage = require('./views/host/apps')
var HostAppsInstallPage = require('./views/host/apps/install')
var HostAppsUpdatePage = require('./views/host/apps/update')
var HostAppsSetRefPage = require('./views/host/apps/set-ref')
var HostAppsStartPage = require('./views/host/apps/start')
var ProcessesPage = require('./views/host/processes')
var ProcessPage = require('./views/process')
var ProcessLogsPage = require('./views/process/logs')
var ProcessExceptionsPage = require('./views/process/exceptions')
var ProcessSnapshotsPage = require('./views/process/snapshots')
var NoHostsPage = require('./views/no-hosts')
var LoadingHostsPage = require('./views/loading-hosts')

module.exports = Router.extend({
  routes: {
    'host/:host': 'host',
    'host/:host/error': 'hostError',
    'host/:host/apps': 'hostAppList',
    'host/:host/apps/install': 'hostAppInstall',
    'host/:host/apps/:app/update': 'hostAppUpdate',
    'host/:host/apps/:app/set-ref': 'hostAppSetRef',
    'host/:host/apps/:app/start': 'hostAppStart',
    'host/:host/processes': 'hostProcessList',
    'host/:host/process/:process': 'process',
    'host/:host/process/:process/logs': 'processLogs',
    'host/:host/process/:process/exceptions': 'processExceptions',
    'host/:host/process/:process/snapshots': 'processSnapshots',
    '': 'catchAll',
    '(*path)': 'catchAll'
  },

  host: function (hostName) {
    this._withHost(hostName, function (host) {
      this.trigger('page', new HostPage({
        model: host
      }))

      App.view.setActiveNav('/host/' + hostName)
    }.bind(this))
  },

  hostAppList: function (hostName) {
    this._withConnectedHost(hostName, function (host) {
      this.trigger('page', new HostAppsPage({
        model: host
      }))

      App.view.setActiveNav('/host/' + hostName + '/apps')
    }.bind(this))
  },

  hostAppInstall: function (hostName) {
    this._withConnectedHost(hostName, function (host) {
      this.trigger('page', new HostAppsInstallPage({
        model: host
      }))

      App.view.setActiveNav('/host/' + hostName + '/apps/install')
    }.bind(this))
  },

  hostAppUpdate: function (hostName, appName) {
    this._withHostAndApp(hostName, appName, function (host, app) {
      this.trigger('page', new HostAppsUpdatePage({
        model: app
      }))

      App.view.setActiveNav('/host/' + hostName + '/apps/' + appName + '/update')
    }.bind(this))
  },

  hostAppSetRef: function (hostName, appName) {
    this._withHostAndApp(hostName, appName, function (host, app) {
      this.trigger('page', new HostAppsSetRefPage({
        model: app
      }))

      App.view.setActiveNav('/host/' + hostName + '/apps/' + appName + '/set-ref')
    }.bind(this))
  },

  hostAppStart: function (hostName, appName) {
    this._withHostAndApp(hostName, appName, function (host, app) {
      this.trigger('page', new HostAppsStartPage({
        model: app
      }))

      App.view.setActiveNav('/host/' + hostName + '/apps/' + appName + '/start')
    }.bind(this))
  },

  hostProcessList: function (hostName) {
    this._withConnectedHost(hostName, function (host) {
      this.trigger('page', new ProcessesPage({
        model: host
      }))

      App.view.setActiveNav('/host/' + hostName + '/processes')
    }.bind(this))
  },

  process: function (hostName, processName) {
    this._withHostAndProcess(hostName, processName, function (host, process) {
      this.trigger('page', new ProcessPage({
        model: process
      }))

      App.view.setActiveNav('/host/' + hostName + '/process/' + processName)
    }.bind(this))
  },

  processLogs: function (hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessLogsPage, '/logs')
  },

  processExceptions: function (hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessExceptionsPage, '/exceptions')
  },

  processSnapshots: function (hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessSnapshotsPage, '/snapshots')
  },

  catchAll: function () {
    if (window.loadingHostList) {
      return this.trigger('page', new LoadingHostsPage())
    } else if (App.hosts.models.length === 0) {
      return this.trigger('page', new NoHostsPage())
    }

    this.redirectTo('/host/' + App.hosts.at(0).name)
  },

  _withHost: function (hostName, callback) {
    App.host = App.hosts.get(hostName)

    if (!App.host) {
      return this.redirectTo('/')
    }

    callback(App.host)
  },

  _withConnectedHost: function (hostName, callback) {
    this._withHost(hostName, function (host) {
      if (App.host.status !== 'connected') {
        return this.redirectTo('/host/' + hostName)
      }

      callback(host)
    }.bind(this))
  },

  _withHostAndApp: function (hostName, appName, callback) {
    this._withConnectedHost(hostName, function (host) {
      var app = host.apps.get(appName)

      if (!app) {
        return this.redirectTo('/host/' + hostName)
      }

      callback(host, app)
    }.bind(this))
  },

  _withHostAndProcess: function (hostName, processName, callback) {
    this._withConnectedHost(hostName, function (host) {
      var process = host.processes.get(processName)

      if (!process) {
        return this.redirectTo('/host/' + hostName + '/processes')
      }

      callback(host, process)
    }.bind(this))
  }
})
