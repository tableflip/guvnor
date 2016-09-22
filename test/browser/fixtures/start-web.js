'use strict'

const cli = require('../../integration/fixtures/cli')
const api = require('../../integration/fixtures/api')
const utils = require('../../integration/fixtures/utils')

module.exports = () => {
  return Promise.all([cli, api])
  .then(results => {
    const cli = results[0]
    const api = results[1]

    return cli(`guv web`)
    .then(utils.onProcessEvent('process:started', 'guv-web', api))
  })
}
