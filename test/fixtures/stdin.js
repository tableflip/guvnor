process.stdin.resume()

process.stdin.on('data', function(buffer) {

  // got some input, inform guvnor
  process.send({
    event: 'stdin:received',
    args: [buffer.toString('utf8').trim()]
  })
})
