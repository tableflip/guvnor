var Router = require('ampersand-router'),
  HostOverviewPage = require('./pages/host/overview'),
  AppsPage = require('./pages/host/apps'),
  ConnectionRefusedPage = require('./pages/host/connectionrefused'),
  TimeoutPage = require('./pages/host/timeout'),
  ConnectingPage = require('./pages/host/connecting'),
  BadSignaturePage = require('./pages/host/badsignature'),
  IncompatiblePage = require('./pages/host/incompatible'),
  HostNotFoundPage = require('./pages/host/hostnotfound'),
  NetworkDownPage = require('./pages/host/networkdown'),
  ErrorPage = require('./pages/host/error'),
  ErrorConnectingPage = require('./pages/host/errorconnecting'),
  ProcessesPage = require('./pages/host/processes'),
  ProcessOverviewPage = require('./pages/process/overview'),
  ProcessLogsPage = require('./pages/process/logs'),
  ProcessExceptionsPage = require('./pages/process/exceptions'),
  ProcessStartingPage = require('./pages/process/starting'),
  ProcessStoppingPage = require('./pages/process/stopping'),
  ProcessStoppedPage = require('./pages/process/stopped'),
  ProcessAbortedPage = require('./pages/process/aborted'),
  ProcessUninitialisedPage = require('./pages/process/uninitialised'),
  ProcessUnresponsivePage = require('./pages/process/unresponsive'),
  ProcessRestartingPage = require('./pages/process/restarting'),
  ProcessFailedPage = require('./pages/process/failed'),
  ProcessErroredPage = require('./pages/process/errored'),
  NoHostsPage = require('./pages/nohosts'),
  LoadingHostsPage = require('./pages/loadinghosts')

module.exports = Router.extend({
  routes: {
    'host/:host': 'host',
    'host/:host/connected': 'host',
    'host/:host/connecting': 'hostConnecting',
    'host/:host/timeout': 'hostTimeout',
    'host/:host/badsignature': 'hostBadSignature',
    'host/:host/incompatible': 'hostIncompatible',
    'host/:host/notfound': 'hostNotFound',
    'host/:host/connectionreset': 'host',
    'host/:host/connectionrefused': 'hostConnectionRefused',
    'host/:host/networkdown': 'hostNetworkDown',
    'host/:host/errorconnecting': 'hostErrorConnecting',
    'host/:host/error': 'hostError',
    'host/:host/apps': 'hostAppList',
    'host/:host/processes': 'hostProcessList',
    'host/:host/process/:process': 'processRunning',
    'host/:host/process/:process/logs': 'processLogs',
    'host/:host/process/:process/exceptions': 'processExceptions',
    'host/:host/process/:process/stopped': 'processStopped',
    'host/:host/process/:process/stopping': 'processStopping',
    'host/:host/process/:process/aborted': 'processAborted',
    'host/:host/process/:process/starting': 'processStarting',
    'host/:host/process/:process/running': 'processRunning',
    'host/:host/process/:process/uninitialised': 'processUninitialised',
    'host/:host/process/:process/unresponsive': 'processUnresponsive',
    'host/:host/process/:process/restarting': 'processRestarting',
    'host/:host/process/:process/failed': 'processFailed',
    'host/:host/process/:process/errored': 'processErrored',
    '': 'catchAll',
    '(*path)': 'catchAll'
  },

  host: function(hostName) {
    this._withHost(hostName, HostOverviewPage)
  },

  hostConnecting: function(hostName) {
    this._withHost(hostName, ConnectingPage)
  },

  hostConnectionRefused: function(hostName) {
    this._withHost(hostName, ConnectionRefusedPage)
  },

  hostTimeout: function(hostName) {
    this._withHost(hostName, TimeoutPage)
  },

  hostBadSignature: function(hostName) {
    this._withHost(hostName, BadSignaturePage)
  },

  hostIncompatible: function(hostName) {
    this._withHost(hostName, IncompatiblePage)
  },

  hostNotFound: function(hostName) {
    this._withHost(hostName, HostNotFoundPage)
  },

  hostNetworkDown: function(hostName) {
    this._withHost(hostName, NetworkDownPage)
  },

  hostErrorConnecting: function(hostName) {
    this._withHost(hostName, ErrorConnectingPage)
  },

  hostError: function(hostName) {
    this._withHost(hostName, ErrorPage)
  },

  hostAppList: function(hostName) {
    this._withHost(hostName, AppsPage, '/apps')
  },

  hostProcessList: function(hostName) {
    this._withHost(hostName, ProcessesPage, '/processes')
  },

  processRunning: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessOverviewPage)
  },

  processLogs: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessLogsPage, '/logs')
  },

  processExceptions: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessExceptionsPage, '/exceptions')
  },

  processStopping: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessStoppingPage)
  },

  processStopped: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessStoppedPage)
  },

  processAborted: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessAbortedPage)
  },

  processStarting: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessStartingPage)
  },

  processUninitialised: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessUninitialisedPage)
  },

  processUnresponsive: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessUnresponsivePage)
  },

  processRestarting: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessRestartingPage)
  },

  processFailed: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessFailedPage)
  },

  processErrored: function(hostName, processId) {
    this._withHostAndProcess(hostName, processId, ProcessErroredPage)
  },

  catchAll: function () {
    if(window.loadingHostList) {
      return this.trigger('page', new LoadingHostsPage())
    } else if(window.app.hosts.models.length === 0) {
      return this.trigger('page', new NoHostsPage())
    }

    this.redirectTo('/host/' + window.app.hosts.at(0).name)
  },

  _withHost: function(hostName, Page, suffix) {
    window.app.host = window.app.hosts.get(hostName)

    if(!window.app.host) {
      return this.redirectTo('/')
    }

    this.trigger('page', new Page({
      model: window.app.host
    }))

    window.app.view.setActiveNav('/host/' + hostName + (suffix ? suffix : ''))
  },

  _withHostAndProcess: function(hostName, processId, Page, suffix) {
    window.app.host = window.app.hosts.get(hostName)

    if(!window.app.host) {
      return this.redirectTo('/')
    }

    var process = window.app.host.processes.get(processId)

    if(!process) {
      return this.redirectTo('/')
    }

    this.trigger('page', new Page({
      model: process
    }))

    window.app.view.setActiveNav('/host/' + hostName + '/process/' + processId + (suffix ? suffix : ''))
  }
})
