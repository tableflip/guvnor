// crash every 10-20 seconds - e.g. not often enough to cause the process to be aborted
setTimeout(function() {
  throw new Error('I die!')
}, ~~(Math.random() * 10000) + 10000)

