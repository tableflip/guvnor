'use strict'

const promise = require('../../../lib/common/promise')
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
    logger.debug('Daemon container ID', id)
    logger.debug('Loading certificates')

    return promise.mapSeries([
      () => commands.fetchCACertificate(runner, id),
      () => commands.fetchRootCertificate(runner, id),
      () => commands.fetchRootKey(runner, id)
    ])
    .then(result => promise.spread(result, (ca, certificate, key) => {
      logger.debug('Spread certificates', ca, certificate, key)

      return {
        certs: {
          ca: ca,
          certificate: certificate,
          key: key
        },
        runner: runner,
        id: id
      }
    }))
  })
})
.catch(error => {
  logger.error('Starting the daemon failed')
  logger.error(error)

  process.exit(1)
})
