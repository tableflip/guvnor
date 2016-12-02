'use strict'

const winston = require('winston')
const removeProcesses = require('../fixtures/remove-processes')
const startWeb = require('../fixtures/start-web')
const configureBrowser = require('../fixtures/configure-browser')
const api = require('../../integration/fixtures/api')
const DEFAULT_TIMEOUT = 30000

const test = {
  before: (browser, done) => {
    if (!process.env.QUIET) {
      winston.level = 'debug'
    }

    winston.cli()

    removeProcesses()
    .then(() => startWeb())
    .then(() => configureBrowser(browser, done))
    .then(() => api)
    .then(result => {
      test.api = result

      return test.api.status()
      .then(status => {
        test.server = status
      })
    })
  },

  after: (browser, done) => {
    api
    .then(api => api.disconnect())
    .then(() => done())
  },

  'Should list processes': browser => browser
    .url('http://localhost:8002')
    .waitForElementVisible('a[href="/host/localhost:8001/processes"]', DEFAULT_TIMEOUT)
    .click('a[href="/host/localhost:8001/processes"]')
    .waitForElementVisible('.process-list', DEFAULT_TIMEOUT)
    .assert.containsText('.processes .panel-title', 'Processes')
    .end(),

  'Should list apps': browser => browser
    .url('http://localhost:8002')
    .waitForElementVisible('a[href="/host/localhost:8001/apps"]', DEFAULT_TIMEOUT)
    .click('a[href="/host/localhost:8001/apps"]')
    .waitForElementVisible('.app-list', DEFAULT_TIMEOUT)
    .assert.containsText('.apps .panel-title', 'Apps')
    .end(),

  'Should show server info': browser => browser
    .url('http://localhost:8002')
    .waitForElementVisible('td.hostname', DEFAULT_TIMEOUT)
    .assert.containsText('td.hostname', test.server.hostname)
    .assert.containsText('td.platform', test.server.platform)
    .assert.containsText('td.arch', test.server.arch)
    .assert.containsText('td.release', test.server.release)
    .assert.containsText('td.daemon', test.server.daemon)
    .end()
}

module.exports = test
