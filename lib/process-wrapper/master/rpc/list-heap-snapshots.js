'use strict'

const fs = require('fs-promise')
const path = require('path')
const crypto = require('crypto')
const config = require('../../config')

const PROCESS_NAME = process.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`]
const EXTENSION = '.heapsnapshot'

const listHeapSnapshots = () => {
  return fs.readdir(process.cwd())
  .then(files => files.filter(file => file.substring(0, PROCESS_NAME.length) === PROCESS_NAME))
  .then(files => files.filter(file => file.substring(file.length - EXTENSION.length) === EXTENSION))
  .then(files => files.map(file => path.join(process.cwd(), file)))
  .then(files => Promise.all(files.map(file => fs.stat(file).then(stat => {
    stat.path = file
    return stat
  }))))
  .then(stats => stats.map(stat => {
    return {
      id: crypto.createHash('md5').update(stat.path).digest('hex'),
      date: stat.birthtime.getTime(),
      path: stat.path,
      size: stat.size
    }
  }))
}

module.exports = listHeapSnapshots
