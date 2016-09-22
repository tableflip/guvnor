'use strict'

const cli = require('../../integration/fixtures/cli')

module.exports = () => {
  return cli
  .then(cli => {
    return cli('guv list --json')
    .then(stdout => JSON.parse(stdout))
    .then(procs => Promise.all(procs.map(proc => cli(`guv rm ${proc.name}`))))
  })
}
