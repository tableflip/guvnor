'use strict'

const driver = require('./driver')
const tamarin = require('tamarin-world')

module.exports = {
  World: class extends tamarin {
    constructor () {
      super(driver)
    }
  }
}
