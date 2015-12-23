var pkg = require('../../../package.json')
var stringify = require('json-stringify-safe')
var Table = require('./Table')
var moment = require('moment')
var formatMemory = require('prettysize')

module.exports = function list (user, api, yargs) {
  var argv = yargs
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

    .epilog('Guvnor v' + pkg.version)
    .argv

  api.process.list(function (error, processes) {
    if (error) {
      throw error
    }

    api.disconnect()

    if (argv.json) {
      return console.info(stringify(processes, null, 2))
    }

    if (process.stdout.isTTY) {
      var table = new Table('No running processes')
      table.addHeader([
        'Name', 'Type', 'PID', 'User', 'Group', 'Uptime', 'CPU', 'RSS', 'Heap size', 'Heap used', 'Status'
      ])

      var addProcessToTable = function (details, proc, type) {
        if (!proc) {
          return table.addRow(['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', type])
        }

        var pid = proc.pid == null ? '?' : proc.pid
        var user = proc.user == null ? '?' : proc.user
        var group = proc.group == null ? '?' : proc.group
        var name = details.name == null ? '?' : details.name
        var uptime = proc.uptime == null || isNaN(proc.uptime) ? '?' : moment.duration(proc.uptime * 1000).humanize()
        var rss = proc.residentSize == null || isNaN(proc.residentSize) ? '?' : formatMemory(proc.residentSize, true)
        var heapTotal = proc.heapTotal == null || isNaN(proc.heapTotal) ? '?' : formatMemory(proc.heapTotal, true)
        var heapUsed = proc.heapUsed == null || isNaN(proc.heapUsed) ? '?' : formatMemory(proc.heapUsed, true)
        var cpu = proc.cpu == null || isNaN(proc.cpu) ? '?' : proc.cpu.toFixed(2)
        var status = details.status == null ? '?' : details.status

        table.addRow([name, type, pid, user, group, uptime, cpu, rss, heapTotal, heapUsed, status])
      }

      processes.forEach(function (proc) {
        if (proc.status === 'running') {
          addProcessToTable(proc, proc.master, 'Master')

          proc.workers.forEach(function (worker) {
            addProcessToTable(proc, worker, 'Worker')
          })
        } else {
          addProcessToTable(proc, {}, '?')
        }
      })

      return table.print(console.info)
    }

    console.info(processes.map(function (proc) {
      return proc.name
    }).join('\n'))
  })
}
