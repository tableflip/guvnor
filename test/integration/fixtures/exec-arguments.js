process.send({
  event: 'arguments:received',
  args: process.execArgv
})
