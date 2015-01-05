var View = require('ampersand-view'),
  templates = require('../../templates'),
  HostListProcessView = require('./process')

module.exports = View.extend({
  template: templates.includes.hostlist.host,
  render: function() {
    this.renderWithTemplate()

    this.renderCollection(this.model.processes, HostListProcessView, '[data-hook=process-list]')
  }
})
