
module.exports = function (guvnor) {
  if (process.env.npm_package_version) {
    return
  }

  // log all received events
  guvnor.on('*', function (type) {
    if (type.substring(0, 'daemon:log'.length) == 'daemon:log' ||
      type.substring(0, 'process:uncaughtexception'.length) == 'process:uncaughtexception' ||
      type.substring(0, 'daemon:fatality'.length) == 'daemon:fatality' ||
      type.substring(0, 'process:log'.length) == 'process:log' ||
      type.substring(0, 'worker:log'.length) == 'worker:log') {
      // already handled
      return
    }

    console.log(type)
  })
  guvnor.on('daemon:log:*', function (type, event) {
    console.log(type, event.message)
  })
  guvnor.on('process:log:*', function (type, processInfo, event) {
    console.log(type, processInfo.id, event)
  })
  guvnor.on('cluster:log:*', function (type, processInfo, event) {
    console.log(type, processInfo.id, event)
  })
  guvnor.on('worker:log:*', function (type, clusterInfo, workerInfo, event) {
    console.log(type, workerInfo.id, event)
  })
  guvnor.on('process:uncaughtexception:*', function (type, error) {
    console.log(error.stack)
  })
  guvnor.on('daemon:fatality', function (error) {
    console.log(error.stack)
  })
}
