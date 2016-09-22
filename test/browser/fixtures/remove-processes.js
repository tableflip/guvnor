'use strict'

const promise = require('../../../lib/common/promise')
const cli = require('../../integration/fixtures/cli')

module.exports = () => {
  return cli
  .then(cli => {
    return cli('guv list --json')
    .then(stdout => JSON.parse(stdout))
    .then(procs => promise.series(procs.map(proc => () => cli(`guv rm ${proc.name}`))))
  })
}
