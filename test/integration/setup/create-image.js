var child_process = require('child_process')
var OutputBuffer = require('output-buffer')
var path = require('path')

module.exports = function buildContainer(tag, callback) {
  var out = new OutputBuffer(console.info)
  var err = new OutputBuffer(console.error)

  var child = child_process.spawn('docker', [
    'build',
    '--tag', tag,
    '.'
  ], {
    cwd: path.resolve(__dirname, '../../../')
  })
  child.stdout.on('data', out.append.bind(out))
  child.stderr.on('data', err.append.bind(err))
  child.on('close', function (code) {
    out.flush()
    err.flush()

    callback(code !== 0 ? new Error('Could not build container - process exited with code ' + code) : undefined)
  })
}
