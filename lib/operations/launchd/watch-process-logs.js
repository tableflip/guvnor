var watch = require('watch')
var fs = require('fs')
var path = require('path')
var operations = require('../')
var async = require('async')
var bus = require('../../daemon/lib/event-bus')

module.exports = function launchdWatchProcessLogs (context, callback) {
  watch.createMonitor('/var/log/guvnor', function (monitor) {
    monitor.on("changed", function (file, curr, prev) {
      var processName = path.basename(file)
      processName = processName.substring(0, processName.length - 4)

      async.parallel({
        process: operations.findProcess.bind(null, context, processName),
        log: readDiff.bind(null, file, prev.size, curr.size - prev.size)
      }, function (error, results) {
        if (error) {
          return context.log([ERROR, CONTEXT], error)
        }

        bus.emit('process:log', context.user, results.process, results.log)
      })
    })

    callback()
  })
}

function readDiff(file, offset, length, callback) {
  var buffer = new Buffer(length)

  fs.open(file, 'r', function (error, fd) {
    if (error) {
      return callback(error)
    }

    fs.read(fd, buffer, 0, length, offset, function (error) {
      if (error) {
        return callback(error)
      }

      fs.close(fd, function (error) {
        if (error) {
          return console.error(error)
        }

        callback(null, buffer.toString('utf8'))
      })
    })
  })
}
