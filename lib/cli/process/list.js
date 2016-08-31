'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const stringify = require('json-stringify-safe')
const Table = require('./Table')
const moment = require('moment')
const formatMemory = require('prettysize')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 list [options]')
    .demand(3)
    .example('$0 list', 'Show all running processes')
    .example('$0 list --json', 'Output json formatted list')

    .describe('json', 'Output list in JSON format')
    .alias('j', 'json')
    .boolean('json')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  return loadApi(certs)
  .then(api => {
    return api.process.list()
    .then(processes => {
      api.disconnect()

      if (argv.json) {
        return stringify(processes, null, 2)
      }

      if (piped) {
        return processes.map((proc) => {
          return proc.name
        }).join('\n')
      }
      const table = new Table('No running processes')
      table.addHeader([
        'Name', 'Type', 'PID', 'User', 'Group', 'Uptime', 'CPU', 'RSS', 'Heap size', 'Heap used', 'Status'
      ])

      const addProcessToTable = (details, proc, type) => {
        if (!proc) {
          return table.addRow(['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', type])
        }

        const pid = proc.pid == null ? '?' : proc.pid
        const user = proc.user == null ? '?' : proc.user
        const group = proc.group == null ? '?' : proc.group
        const name = details.name == null ? '?' : details.name
        const uptime = proc.uptime == null || isNaN(proc.uptime) ? '?' : moment.duration(proc.uptime * 1000).humanize()
        const rss = proc.residentSize == null || isNaN(proc.residentSize) ? '?' : formatMemory(proc.residentSize, true)
        const heapTotal = proc.heapTotal == null || isNaN(proc.heapTotal) ? '?' : formatMemory(proc.heapTotal, true)
        const heapUsed = proc.heapUsed == null || isNaN(proc.heapUsed) ? '?' : formatMemory(proc.heapUsed, true)
        const cpu = proc.cpu == null || isNaN(proc.cpu) ? '?' : proc.cpu.toFixed(2)
        const status = details.status == null ? '?' : details.status

        table.addRow([name, type, pid, user, group, uptime, cpu, rss, heapTotal, heapUsed, status])
      }

      processes.forEach((proc) => {
        if (proc.status === 'running') {
          addProcessToTable(proc, proc.master, 'Master')

          proc.workers.forEach((worker) => {
            addProcessToTable(proc, worker, 'Worker')
          })
        } else {
          addProcessToTable(proc, {}, '?')
        }
      })

      return table.toString()
    })
  })
  .catch(error => {
    console.error(error.stack)

    throw error
  })
}
