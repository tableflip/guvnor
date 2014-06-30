var fs = require('fs'),
  os = require('os'),
  should = require('should'),
  tmp = require('tmp'),
  LogRedirector = require('../lib/LogRedirector')

describe('LogRedirector', function() {
  it('should redirect stdout and stderr to files', function(done) {
    tmp.file(function(er, outPath) {
      if(er) throw er

      tmp.file(function(er, errPath) {
        if(er) throw er

        // Save the original stdout and stderr write functions so we can restore them after the test
        var stdoutWrite = process.stdout.write
        var stderrWrite = process.stderr.write

        var redirector = new LogRedirector(outPath, errPath)

        redirector.on('ready', function() {
          var logLines = ['Testing', '1', '2', '3']

          logLines.forEach(function(line) {
            console.log(line)
          })

          var errLines = ['Failing', '3', '2', '1']

          errLines.forEach(function(line) {
            console.error(line)
          })

          // Pause while the log lines are written to the files
          setTimeout(function() {
            // Restore stdout/stderr
            process.stdout.write = stdoutWrite
            process.stderr.write = stderrWrite

            fs.readFile(outPath, {encoding: 'utf-8'}, function(er, contents) {
              if(er) throw er
              contents.should.equal(logLines.join(os.EOL) + os.EOL)

              fs.readFile(errPath, {encoding: 'utf-8'}, function(er, contents) {
                if(er) throw er
                contents.should.equal(errLines.join(os.EOL) + os.EOL)
                done()
              })
            })
          }, 1000)
        })
      })
    })
  })
})