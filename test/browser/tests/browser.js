'use strict'

const winston = require('winston')

if (!process.env.QUIET) {
  winston.level = 'debug'
}

winston.cli()

const removeProcesses = require('../fixtures/remove-processes')
const startWeb = require('../fixtures/start-web')
const configureBrowser = require('../fixtures/configure-browser')
const api = require('../../integration/fixtures/api')
const DEFAULT_TIMEOUT = 30000

module.exports = {
  before: (browser, done) => {
    removeProcesses()
    .then(() => startWeb())
    .then(() => configureBrowser(browser, done))
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
    .end()
}
