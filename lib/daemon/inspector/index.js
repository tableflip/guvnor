var DebugServer = require('../../../node_modules/node-inspector/lib/debug-server').DebugServer

process.title = 'boss - node-inspector'

var debugServer = new DebugServer()
debugServer.start({
  webPort: parseInt(process.env.BOSS_NODE_INSPECTOR_PORT),
  webHost: process.env.BOSS_NODE_INSPECTOR_HOST
})
debugServer.once('listening', function(error) {
  if(error) {
    process.send({
      type: 'node-inspector:failed',
      args: [{
        message: error.message,
        code: error.code,
        stack: error.stack
      }]
    })
  } else {
    process.send({
      type: 'node-inspector:ready',
      args: [
        debugServer.address().port
      ]
    })
  }
}.bind(this))
