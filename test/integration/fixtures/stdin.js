var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("What do you think of node.js? ", function(answer) {
  console.log("Thank you for your valuable feedback:", answer);

  rl.close();
});

process.on('custom:stdin', function(message) {
  process.stdin.write(message + '\n')
})
