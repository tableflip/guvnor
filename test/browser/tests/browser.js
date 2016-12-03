'use strict'

const winston = require('winston')
const faker = require('faker')
const removeProcesses = require('../fixtures/remove-processes')
const startWeb = require('../fixtures/start-web')
const configureBrowser = require('../fixtures/configure-browser')
const api = require('../../integration/fixtures/api')

const procName = () => {
  const name =  `${faker.lorem.word()}_${faker.lorem.word()}_${faker.lorem.word()}_${faker.lorem.word()}`

  return name
}

const startProcess = (browser, script) => {
  const name = procName()

  browser
    .perform(function (done) {
      test.api.process.start(script || '/opt/guvnor/test/fixtures/hello-world.js', {
        name: name,
        workers: 1
      })
      .then(() => {
        done()
      })
    })

    return name
}

const test = {
  before: (browser, done) => {
    if (!process.env.QUIET) {
      winston.level = 'debug'
    }

    winston.cli()

    removeProcesses()
    .then(() => startWeb())
    .then(() => configureBrowser(browser))
    .then(() => api)
    .then(result => {
      test.api = result

      return test.api.status()
      .then(status => {
        test.server = status

        done()
      })
    })
    .catch(error => done(error))
  },

  after: (browser, done) => {
    api
    .then(api => api.disconnect())
    .then(() => done())
  },

  'Should list processes': function (browser) {
    browser.page.home()
      .navigate()
      .navigateToProcessList()

    browser.page.processes()
      .waitForElementVisible('@panel')
      .assert.containsText('@panelTitle', 'Processes')
      .assert.containsText('@processesTable', 'guv-web')
      .assert.containsText('@userColumn', 'root')
      .assert.containsText('@groupColumn', 'root')
      .assert.containsText('@memoryColumn', 'MB')
      .assert.containsText('@cpuColumn', '%')

    browser.end()
  },

  'Should list apps': function (browser) {
    browser.page.home()
      .navigate()
      .navigateToAppList()

    browser.page.apps()
      .waitForElementVisible('@panel')
      .assert.containsText('@panelTitle', 'Apps')

    browser.end()
  },

  'Should show server info': function (browser) {
    browser.page.home()
      .navigate()

    browser.page.host()
      .waitForElementVisible('@panel')
      .assert.containsText('@hostNameColumn', test.server.hostname)
      .assert.containsText('@platformColumn', test.server.platform)
      .assert.containsText('@archColumn', test.server.arch)
      .assert.containsText('@releaseColumn', test.server.release)
      .assert.containsText('@daemonColumn', test.server.daemon)

    browser.end()
  },

  'Should show process info': function (browser) {
    const proc = startProcess(browser)

    browser.page.home()
      .navigate()
      .navigateToProcess(proc)

    browser.page.process()
      .assert.containsText('@processPanelTitle', proc)

    browser.end()
  },

  'Should stop and start a process': function (browser) {
    const proc = startProcess(browser)

    browser.page.home()
      .navigate()
      .navigateToProcess(proc)

    let procInfo = null

    browser.perform(function (done) {
      test.api.process.get(proc)
      .then(info => {
        procInfo = info

        done()
      })
    })

    browser.page.process()
      .stopProcess()

    browser.page.home()
      .shouldShowNotification('Process stopped', `${proc} on localhost:8001 stopped`)

    browser.page.process()
      .waitForElementVisible('@stoppedPanel')
      .assert.containsText('@stoppedPanel', `${proc} is not running.`)
      .click('@startProcessButton')
      .waitForElementVisible('@startProcessForm')

    browser.perform(function (client, done) {
        client.page.process().getValue('@startFormWorkers', function (result) {
          this.assert.equal(result.value, procInfo.workers.length)
        })
        client.page.process().getValue('@startFormUser', function (result) {
          this.assert.equal(result.value, procInfo.workers[0].user)
        })
        client.page.process().getValue('@startFormGroup', function (result) {
          this.assert.equal(result.value, procInfo.workers[0].group)
        })
        //client.page.process().getValue('@startFormDebug', function (result) {
        //  this.assert.equal(result.value, procInfo.debug)
        //})
        client.page.process().getValue('@startFormCwd', function (result) {
          this.assert.equal(result.value, procInfo.workers[0].cwd)
        })
        client.page.process().getValue('@startFormExecArgv', function (result) {
          this.assert.equal(result.value, procInfo.workers[0].execArgv.join(' '))
        })
        client.page.process().getValue('@startFormArgv', function (result) {
          this.assert.equal(result.value, procInfo.workers[0].argv.slice(2).join(' '))
        })
        // TODO: assert env is populated correctly

        done()
      })

    browser.page.process()
      .click('@startFormSubmit')
/*
    browser.page.process()
      .waitForElementVisible('@startingPanel')
      .assert.containsText('@startingPanel', `${proc} starting...`)
*/
    browser.end()
  }
}

module.exports = test
