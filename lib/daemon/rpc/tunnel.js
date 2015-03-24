var posix = require('posix')

// drop privileges
var num = parseInt(process.env.GUVNOR_USER, 10)
var user = posix.getpwnam(num)

if (user.gid !== process.getgid()) {
  process.setgid(user.gid)
  process.setgroups([]) // Remove old groups
  process.initgroups(user.uid, user.gid) // Add user groups
}

if (user.uid !== process.getuid()) {
  process.setuid(user.uid) // Switch to requested user
}

// create dnode connection
var dnode = require('boss-dnode')

var client = dnode.connect(process.env.GUVNOR_SOCKET)
client.on('remote', function (remote) {
  var d = dnode(remote)
  process.stdin.pipe(d).pipe(process.stdout)
  process.send('remote:ready')
})

// make sure we don't exit immediately
process.stdin.resume()
