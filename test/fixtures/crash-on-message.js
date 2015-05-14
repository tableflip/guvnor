process.on('custom:euthanise', function () {

  process.nextTick(function () {
    throw new Error('goodbye cruel world')
  })
})
