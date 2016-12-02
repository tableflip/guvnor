'use strict'

const cli = require('../../integration/fixtures/cli')
const api = require('../../integration/fixtures/api')
const utils = require('../../integration/fixtures/utils')

module.exports = () => {
  return Promise.all([cli, api])
  .then(([cli, api]) => {
    return cli(`guv web`)
    .then(utils.onProcessEvent('process:worker:listening', 'guv-web', api))
  })
}
