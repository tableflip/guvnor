process.send({
  event: 'arguments:received',
  args: process.argv.slice(2)
})
