'use strict'

const daemon = require('../../integration/fixtures/daemon')
const DEFAULT_TIMEOUT = 3600000

module.exports = function () {
console.info('-------')
console.info(Object.keys(this))
console.info('-------')

  this.World = require('./world').World // overwrite default World constructor
  this.setDefaultTimeout(DEFAULT_TIMEOUT)

  this.BeforeFeatures(function () {
    return daemon
    .then(results => {
      // results.ca

    })
  })

  this.AfterFeatures(function () {
    return driver.quit()
  })
}
