var app = require('ampersand-app')
var Router = require('ampersand-router')
var HostPage = require('./views/host')
var HostAppsPage = require('./views/host/apps')
var HostAppsInstallPage = require('./views/host/apps/install')
var ProcessesPage = require('./views/host/processes')
var ProcessPage = require('./views/process/overview')
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
    'host/:host/processes': 'hostProcessList',
    'host/:host/process/:process': 'processRunning',
    'host/:host/process/:process/logs': 'processLogs',
    'host/:host/process/:process/exceptions': 'processExceptions',
    'host/:host/process/:process/snapshots': 'processSnapshots',
    'host/:host/process/:process/stopped': 'processStopped',
    'host/:host/process/:process/stopping': 'processStopping',
    'host/:host/process/:process/aborted': 'processAborted',
    'host/:host/process/:process/starting': 'processStarting',
    'host/:host/process/:process/started': 'processStarted',
    'host/:host/process/:process/running': 'processRunning',
    'host/:host/process/:process/uninitialised': 'processUninitialised',
    'host/:host/process/:process/unresponsive': 'processUnresponsive',
    'host/:host/process/:process/restarting': 'processRestarting',
    'host/:host/process/:process/failed': 'processFailed',
    'host/:host/process/:process/errored': 'processErrored',
    'host/:host/process/:process/paused': 'processPaused',
    '': 'catchAll',
    '(*path)': 'catchAll'
  },

  host: function (hostName) {
    this._withHost(hostName, function (host) {
      this.trigger('page', new HostPage({
        model: app.host
      }))

      app.view.setActiveNav('/host/' + hostName)
    }.bind(this))
  },

  hostAppList: function (hostName) {
    this._withConnectedHost(hostName, function (host) {
      this.trigger('page', new HostAppsPage({
        model: app.host
      }))

      app.view.setActiveNav('/host/' + hostName + '/apps')
    }.bind(this))
  },

  hostAppInstall: function (hostName) {
    this._withConnectedHost(hostName, function (host) {
      this.trigger('page', new HostAppsInstallPage({
        model: app.host
      }))

      app.view.setActiveNav('/host/' + hostName + '/apps/install')
    }.bind(this))
  },

  hostProcessList: function (hostName) {
    this._withConnectedHost(hostName, function (host) {
      this.trigger('page', new ProcessesPage({
        model: app.host
      }))

      app.view.setActiveNav('/host/' + hostName + '/processes')
    }.bind(this))
  },

  process: function (hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessPage)
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
    } else if (app.hosts.models.length === 0) {
      return this.trigger('page', new NoHostsPage())
    }

    this.redirectTo('/host/' + app.hosts.at(0).name)
  },

  _withHost: function (hostName, callback) {
    app.host = app.hosts.get(hostName)

    if (!app.host) {
      return this.redirectTo('/')
    }

    callback(app.host)
  },

  _withConnectedHost: function (hostName, callback) {
    this._withHost(hostName, function (host) {
      if (app.host.status !== 'connected') {
        return this.redirectTo('/host/' + hostName)
      }

      callback(host)
    }.bind(this))
  },

  _withHostAndProcess: function (hostName, processId, Page, suffix) {
    app.host = app.hosts.get(hostName)

    if (!app.host) {
      return this.redirectTo('/')
    }

    var process = app.host.processes.get(processId)

    if (!process) {
      return this.redirectTo('/')
    }

    this.trigger('page', new Page({
      model: process
    }))

    app.view.setActiveNav('/host/' + hostName + '/process/' + processId + (suffix ? suffix : ''))
  }
})
