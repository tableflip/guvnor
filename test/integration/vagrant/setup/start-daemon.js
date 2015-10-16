var child_process = require('child_process')
var OutputBuffer = require('output-buffer')

module.exports = function startDaemon(callback) {
  var out = new OutputBuffer(console.info)
  var err = new OutputBuffer(console.error)

  var child = child_process.spawn('vagrant', [
    'ssh', '-c', 'sudo\ node\ /opt/guvnor/lib/daemon'
  ], {
    cwd: __dirname,
    env: {
      HOME: process.env.HOME,
      PATH: process.env.PATH
    }
  })
  child.stdout.on('data', out.append.bind(out))
  child.stderr.on('data', err.append.bind(err))
  child.on('close', function (code) {
    out.flush()
    err.flush()
  })

  child.stdout.on('data', function (data) {
    if (data.toString('utf8').indexOf('Guvnor is running') !== -1) {
      callback(null, child)
    }
  })
}
