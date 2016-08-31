'use strict'

const test = require('ava')

const daemon = require('./fixtures/daemon')

require('./_api')
require('./_cli')

test.after.always('Print daemon logs', t => {
  if (daemon.printLogs) {
    console.info('')
    console.info('---- Start test logs -----')
    console.info('')
    return daemon.printLogs()
    .then(() => {
      console.info('')
      console.info('---- End test logs -----')
      console.info('')
    })
  }
})

test.after.always('Take heap snapshot', t => {
  if (daemon.takeHeapSnapshot) {
    return daemon.takeHeapSnapshot()
  }
})

test.after.always('Fetch coverage info', t => {
  if (daemon.fetchCoverage) {
    return daemon.fetchCoverage()
  }
})
