const emit = require('./daemon')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

readline.on('line', (line) => {
  console.error('incoming line', line)
  const args = JSON.parse(line)

  args.push((error, body) => {
    if (error) {
      console.error(JSON.stringify({
        message: error.message,
        code: error.code,
        stack: error.stack
      }))
    } else if (body) {
      console.info(JSON.stringify(body))
    }

    process.exit(0)
  })

  emit.apply(null, args)
})
