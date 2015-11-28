var View = require('ampersand-view')
var AmpersandModel = require('ampersand-model')
var $ = require('jquery')

var Model = AmpersandModel.extend({
  props: {
    title: 'string',
    showCloseButton: 'boolean',
    isDanger: 'boolean',
    okText: ['string', true, 'OK'],
    cancelText: ['string', true, 'Cancel'],
    showButtons: ['boolean', true, true],
    showCancel: ['boolean', true, true],
    showOk: ['boolean', true, true]
  }
})

module.exports = View.extend({
  template: require('./modal.hbs'),
  initialize: function () {
    this.model = new Model()
  },
  bindings: {
    'model.title': '[data-hook=title]',
    'model.okText': '[data-hook=ok-button]',
    'model.cancelText': '[data-hook=cancel-button]',
    'model.showCloseButton': {
      type: 'toggle',
      selector: '[data-hook=close-button]'
    },
    'model.isDanger': {
      type: 'booleanClass',
      yes: 'btn-danger',
      no: 'btn-primary',
      selector: '[data-hook=ok-button]'
    },
    'model.showButtons': {
      type: 'toggle',
      selector: '[data-hook=modal-buttons]'
    },
    'model.showOk': {
      type: 'toggle',
      selector: '[data-hook=ok-button]'
    },
    'model.showCancel': {
      type: 'toggle',
      selector: '[data-hook=cancel-button]'
    }
  },
  events: {
    'click [data-hook=ok-button]': 'okClicked'
  },
  setTitle: function (title) {
    this.model.title = title
  },
  setOkText: function (text) {
    this.model.okText = text
  },
  setCancelText: function (text) {
    this.model.cancelText = text
  },
  setIsDanger: function (danger) {
    this.model.isDanger = danger
  },
  setContent: function (content) {
    if (this._content) {
      this._content.remove()
    }

    this._content = this.renderSubview(content, '[data-hook=modal-content]')
  },
  setCallback: function (callback) {
    this._callback = callback
  },
  setShowButtons: function (show) {
    this.model.showButtons = show
  },
  setShowOk: function (show) {
    this.model.showOk = show
  },
  setShowCancel: function (show) {
    this.model.showCancel = show
  },
  okClicked: function () {
    if (this._callback) {
      var result = this._callback()

      if (result === false) {
        return
      }
    }

    this.dismiss()
  },
  dismiss: function () {
    $(this.el).modal('hide')
  },
  show: function () {
    $(this.el).modal('show')
  },
  reset: function () {
    this.setShowButtons(true)
    this.setShowOk(true)
    this.setShowCancel(true)
    this.setCallback(null)
    this.setIsDanger(false)
    this.setTitle('Hello world')
    this.setOkText('Ok')
    this.setCancelText('Cancel')
  }
})
