'use strict'

require('chai')
  .use(require('chai-as-promised'))
  .should()

var configure = function () {
  this.setDefaultTimeout(60 * 1000)
}

module.exports = configure
