'use strict'

const path = require('path')
const Wreck = require('wreck')
const runner = require('./runner')
const os = require('os')
const logger = require('winston')
const fs = require('fs-promise')
const commands = require('./commands')

module.exports = runner()
.then(runner => {
  return commands.findContainer(runner)
  .then(id => {
    return Promise.all([
      commands.fetchCACertificate(runner, id),
      commands.fetchRootCertificate(runner, id),
      commands.fetchRootKey(runner, id)
    ])
    .then(results => {
      return {
        certs: {
          ca: results[0],
          certificate: results[1],
          key: results[2]
        },
        runner: runner,
        id: id
      }
    })
  })
})
.catch(error => {
  logger.error('Starting the daemon failed')
  logger.error(error)

  process.exit(1)
})
