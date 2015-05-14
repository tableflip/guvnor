var DebugServer = require('../../../node_modules/node-inspector/lib/debug-server').DebugServer

process.title = 'guvnor - node-inspector'

var debugServer = new DebugServer()
debugServer.start({
  webPort: parseInt(process.env.GUVNOR_NODE_INSPECTOR_PORT, 10),
  webHost: process.env.GUVNOR_NODE_INSPECTOR_HOST
})
debugServer.once('listening', function (error) {
  if (error) {
    process.send({
      event: 'node-inspector:failed',
      args: [{
        message: error.message,
        code: error.code,
        stack: error.stack
      }]
    })
  } else {
    process.send({
      event: 'node-inspector:ready',
      args: [
        debugServer.address().port
      ]
    })
  }
})
