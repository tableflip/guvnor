// Start reading from stdin so we don't exit.
process.stdin.resume()

process.on('SIGUSR1', function () {
  console.log('Got SIGUSR1')

  process.send({
    event: 'signal:received',
    args: ['SIGUSR1']
  })
})

process.on('SIGTERM', function () {
  console.log('Got SIGTERM')

  process.send({
    event: 'signal:received',
    args: ['SIGTERM']
  })
})

process.on('SIGPIPE', function () {
  console.log('Got SIGPIPE')

  process.send({
    event: 'signal:received',
    args: ['SIGPIPE']
  })
})

process.on('SIGHUP', function () {
  console.log('Got SIGHUP')

  process.send({
    event: 'signal:received',
    args: ['SIGHUP']
  })
})

process.on('SIGINT', function () {
  console.log('Got SIGINT')

  process.send({
    event: 'signal:received',
    args: ['SIGINT']
  })
})

process.on('SIGBREAK', function () {
  console.log('Got SIGBREAK')

  process.send({
    event: 'signal:received',
    args: ['SIGBREAK']
  })
})

process.on('SIGWINCH', function () {
  console.log('Got SIGWINCH')

  process.send({
    event: 'signal:received',
    args: ['SIGWINCH']
  })
})
