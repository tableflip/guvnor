'use strict'

const logger = require('winston')
logger.cli()
logger.level = 'debug'

const startServer = require('./start-server')

startServer()
