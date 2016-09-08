'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 rmapp [options] app1 app2...')
    .demand(4, 'Please specify an app to remove')
    .example('$0 rmapp my-app', 'Remove my-app')
    .example('$0 rmapp my-app my-other-app', 'Remove multiple apps')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  let name = argv._[3]

  return loadApi(certs, {
    404: `No app found for ${name}`,
    409: `App ${name} was running`
  }, api => api.app.remove(name).then(() => `Removed app ${name}`))
}
