// Start reading from stdin so we don't exit.
process.stdin.resume()

process.on('SIGUSR1', function() {
  console.log('Got SIGUSR1')
})

process.on('SIGTERM', function() {
  console.log('Got SIGTERM')
})

process.on('SIGPIPE', function() {
  console.log('Got SIGPIPE')
})

process.on('SIGHUP', function() {
  console.log('Got SIGHUP')
})

process.on('SIGINT', function() {
  console.log('Got SIGINT')
})

process.on('SIGBREAK', function() {
  console.log('Got SIGBREAK')
})

process.on('SIGWINCH', function() {
  console.log('Got SIGWINCH')
})
