#!/usr/bin/env node

var Wreck = require('wreck')
var yargs = require('yargs')
var plist = require('plist')
var fs = require('fs')

var PORT = 26372

var wreck = Wreck.defaults({
  baseUrl: 'http://localhost:' + PORT
})

function list (yargs) {
  wreck.get('/processes', {
    json: true
  }, function (error, response, payload) {
    if (error) {
      console.error(error)
    }

    console.info('PID\tStatus\tLabel')

    payload.forEach(function (proc) {
      console.info('%s\t%d\t%s', proc.pid || '-', proc.status, proc.name)
    })
  })
}

function load (yargs) {
  var argv = yargs
    .usage('Usage: $0 load [options] <path/to/plist>')
    .demand(2)
    .option('w', {
      boolean: true,
      describe: 'If the service is disabled, it will be enabled'
    })
    .argv

  var proc = argv._[1]
  var obj = plist.parse(fs.readFileSync(proc, {
    encoding: 'utf8'
  }))

  wreck.post('/processes', {
    json: true,
    payload: JSON.stringify({
      name: obj.Label
    })
  }, function (error, response, payload) {
    if (error) {
      console.error(error)
    }

    wreck.put('/processes/' + obj.Label, {
      payload: JSON.stringify({
        running: true
      })
    }, function (error, response, payload) {
      if (error) {
        console.error(error)
      }
    })
  })
}

function unload (yargs) {
  var argv = yargs
    .usage('Usage: $0 unload [options] <path/to/plist>')
    .demand(2)
    .option('w', {
      boolean: true,
      describe: 'Additionally disables the service'
    })
    .argv

  var proc = argv._[1]
  var obj = plist.parse(fs.readFileSync(proc, {
    encoding: 'utf8'
  }))

  wreck.delete('/processes/' + obj.Label, function (error, response, payload) {
    if (error) {
      console.error(error)
    }
  })
}

yargs
  .usage('Usage: $0 <command> [options]')
  .command('list', 'Lists information about services.', list)
  .command('load', 'Bootstraps a service or directory of services.', load)
  .command('unload', 'Unloads a service or directory of services.', unload)
  .demand(2, 'Please specify a subcommand')
  .argv
