'use strict'

module.exports = {
  url: 'http://localhost:8002',
  elements: {
    hostList: {
      selector: '.host-list'
    },
    notification: {
      selector: 'div[data-notify=container]'
    },
    notificationHeader: {
      selector: 'div[data-notify=container] span[data-notify=message] h4'
    },
    notificationMessage: {
      selector: 'div[data-notify=container] span[data-notify=message]'
    },
    processesLink: {
      selector: 'a[href="/host/localhost:8001/processes"]'
    },
    processLink: {
      selector: '.host-list .processName a'
    },
    appsLink: {
      selector: 'a[href="/host/localhost:8001/apps"]'
    }
  },
  commands: [{
    navigateToProcessList: function () {
      this
        .waitForElementVisible('@processLink')
        .waitForElementVisible('@processesLink')
        .click('@processesLink')
    },

    navigateToAppList: function () {
      this
        .waitForElementVisible('@processLink')
        .waitForElementVisible('@appsLink')
        .click('@appsLink')
    },

    navigateToProcess: function (name) {
      const xpath = `//*[contains(@class, 'host-list')]//span[@data-hook='process-name' and text()='${name}']/..`

      this.api
        .useXpath()
        .waitForElementVisible(xpath)
        .click(xpath)
        .useCss()

      return this.api.page.process().waitForElementVisible('@processPanelTitle')
    },

    shouldShowNotification: function (title, message) {
      this.waitForElementVisible('@notification')
      this.assert.containsText('@notificationHeader', title)
        .assert.containsText('@notificationMessage', message)
    }
  }]
}
