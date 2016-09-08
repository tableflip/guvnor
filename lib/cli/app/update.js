'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 app udpate [options] <app>')
    .demand(4, 'Please specify an app to update')
    .example('$0 app update my-app', 'Updates all refs for my-app')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const name = argv._[3]

  return loadApi(certs, {
    404: `No app found for ${name}`,
    409: `App ${name} was running`
  }, api => api.app.update(name, console.info).then(app => `Updated ${app.name}`))
}
