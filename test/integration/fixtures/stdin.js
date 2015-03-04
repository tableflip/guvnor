var readline = require('readline')

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Say something!', function (answer) {
  process.send({
    event: 'stdin:received',
    args: [answer]
  })

  rl.close()
})
