var child_process = require('child_process')

if (child_process.execSync) {
  // node 0.12+, io.js
  module.exports = child_process.execSync.bind(child_process)
} else {
  // node 0.10
  var execSync = require('execSync')

  module.exports = function () {
    var result = execSync.exec.apply(execSync, arguments)

    if (result.code !== 0) {
      throw new Error('Command failed with code ' + result.code)
    }

    return result.stdout.trim()
  }
}
