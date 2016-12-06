# Help

1. [Starting and stopping processes](processes.md)
1. [Controlling the Daemon](daemon.md)
1. [Managing clusters](clusters.md)
1. [Installing and running apps](apps.md)
1. [Remote access and monitoring (e.g. guv-web)](remote.md)
1. [Web interface](web.md)
1. [Web interface - configuration](web-config.md)
1. [Web interface - user management](web-users.md)
1. Programmatic access
1. [Programmatic access - local](programmatic-access-local.md)
1. [Programmatic access - remote](programmatic-access-remote.md)
1. [Programmatic access - events](programmatic-access-events.md)

## Programmatic access

It is possible to connect to guvnor from your own program:

### From node

```javascript
const fs = require('fs')
const guvnor = require('guvnor')

const certs = {
  ca: fs.readFileSync('/etc/guvnor/ca.crt'),
  cert: fs.readFileSync('/home/me/.config/guvnor/me.pub'),
  key: fs.readFileSync('/home/me/.config/guvnor/me.key')
}

guvnor('https://localhost:8001', certs)
.then(api => {
  // list processes
  api.process.list()
  .then(processes => {
    api.disconnect()
  })
  .catch(error => {
    api.disconnect()
  })
})
```

### From the browser

In the browser you must first install a PKCS12 keybundle for the server you wish to connect to.

```javascript
const guvnor = require('guvnor')

guvnor('https://localhost:8001')
.then(api => {
  // list processes
  api.process.list()
  .then(processes => {
    api.disconnect()
  })
  .catch(error => {
    api.disconnect()
  })
})
```

### Processes

#### Listing processes

```javascript
api.process.list()
.then(processes => {
  console.info(processes)
})
```

#### Starting a process

```javascript
api.process.start('/path/to/index.js', {
  group: 'users',
  workers: 1,
  name: 'my proc',
  argv: ['arg1', 'arg2'],
  execArgv: ['arg3', 'arg4'],
  debug: false,
  env: {
    KEY: 'value'
  },
  chroot: false,
  cwd: __dirname,
  interpreter: '/usr/bin/node'
})
.then(proc => {
  console.info(`Process ${proc.name} started`)
})
```

#### Stopping a process

```javascript
api.process.stop('my-proc')
.then(() => {
  console.info('Process stopped')
}))
```
