'use strict'

const DEFAULT_TIMEOUT = 30000

module.exports = {
  url: 'http://localhost:8002',
  elements: {
    processPanelTitle: {
      selector: '.panel.process .panel-title'
    }
  },
  commands: [{
    selectProcessFromHostList: function (name) {
      const xpath = `//*[contains(@class, 'host-list')]//span[@data-hook='process-name' and text()='${name}']/..`

      this.api
        .useXpath()
        .waitForElementVisible(xpath, DEFAULT_TIMEOUT)
        .click(xpath)
        .useCss()

      return this.waitForElementVisible('@processPanelTitle', DEFAULT_TIMEOUT)
    }
  }]
}
