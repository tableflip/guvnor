require('../../common/HelpfulError')

function sendErrorAndExit (message, error) {
  if (arguments.length === 1) {
    error = message
    message = error.message
  }

  process.send({
    type: 'remote:error',
    args: [{
      message: message,
      stack: error.stack,
      code: error.code
    }]
  })

  process.exit(1)
}

var posix = require('posix')

try {
  // drop privileges
  var user = posix.getpwnam(process.env.GUVNOR_USER)

  if (user.gid !== process.getgid()) {
    process.setgid(user.gid)
    process.setgroups([]) // Remove old groups
    process.initgroups(user.uid, user.gid) // Add user groups
  }

  if (user.uid !== process.getuid()) {
    process.setuid(user.uid) // Switch to requested user
  }
} catch (e) {
  sendErrorAndExit('Could not switch to ' + process.env.GUVNOR_USER, e)
}

// create dnode connection
var dnode = require('boss-dnode')
var client

try {
  client = dnode.connect(process.env.GUVNOR_SOCKET)
} catch (e) {
  sendErrorAndExit(e)
}

client.on('remote', function (remote) {
  var d = dnode(remote)
  process.stdin.pipe(d).pipe(process.stdout)
  process.send({
    type: 'remote:ready'
  })
})
client.on('error', sendErrorAndExit)

// make sure we don't exit immediately
process.stdin.resume()
