'use strict'

module.exports = {
  elements: {
    processPanelTitle: {
      selector: '.panel.process .panel-title'
    },
    stopProcessButton: {
      selector: 'button[data-hook=stop-process-button]'
    },
    startProcessButton: {
      selector: 'button[data-hook=start-process-button]'
    },
    stoppedPanel: {
      selector: '.panel.process-stopped'
    },
    startingPanel: {
      selector: '.panel.process-starting'
    },
    startProcessForm: {
      selector: 'form.start-form'
    },
    startFormUser: {
      selector: 'form.start-form select[name=user]'
    },
    startFormGroup: {
      selector: 'form.start-form select[name=group]'
    },
    startFormDebug: {
      selector: 'form.start-form input[name=debug]'
    },
    startFormCwd: {
      selector: 'form.start-form input[name=cwd]'
    },
    startFormWorkers: {
      selector: 'form.start-form select[name=workers]'
    },
    startFormExecArgv: {
      selector: 'form.start-form input[name=execArgv]'
    },
    startFormArgv: {
      selector: 'form.start-form input[name=argv]'
    },
    startFormSubmit: {
      selector: 'form.start-form .btn-primary'
    }
  },
  commands: [{
    stopProcess: function () {
      return this
        .waitForElementVisible('@stopProcessButton')
        .click('@stopProcessButton')
    },
    startProcess: function () {
      return this
        .waitForElementVisible('@startProcessButton')
        .click('@startProcessButton')
    }
  }]
}
