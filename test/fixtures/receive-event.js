console.info('hello')

process.on('custom:event:sent', function () {
  console.info('received event with args', arguments)

  process.send({
    event: 'custom:event:received',
    args: Array.prototype.slice.call(arguments)
  })
})
