require('../../common/HelpfulError')

var posix = require('posix')
var dnode = require('boss-dnode')

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

function switchUser (userName) {
  try {
    // drop privileges
    var user = posix.getpwnam(userName)

    if (user.gid !== process.getgid()) {
      process.setgid(user.gid)
      process.setgroups([]) // Remove old groups
      process.initgroups(user.uid, user.gid) // Add user groups
    }

    if (user.uid !== process.getuid()) {
      process.setuid(user.uid) // Switch to requested user
    }
  } catch (e) {
    sendErrorAndExit('Could not switch to ' + userName, e)
  }
}

// e.g. we are root but really alex wants to run a process as alan.
// root can switch to alan but perhaps alex can't, so first switch to alex
switchUser(process.env.GUVNOR_RUNNING_USER)
// then switch to alan
switchUser(process.env.GUVNOR_TARGET_USER)

// create dnode connection
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
