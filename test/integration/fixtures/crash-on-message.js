
process.on('custom:euthanise', function() {
  throw new Error('goodbye cruel world')
})
