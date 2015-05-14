
module.exports = {
  daemonise: true,
  guvnor: {
    user: 'root',
    group: 'guvnor',
    logdir: '/var/log/guvnor',
    rundir: '/var/run/guvnor',
    confdir: '/etc/guvnor',
    appdir: '/usr/local/guvnor',
    timeout: 10000,
    autoresume: true,
    restarttimeout: 5000,
    rpctimeout: 5000,
    minnodeversion: '0.10.29'
  },
  remote: {
    enabled: true,
    port: 57483,
    host: '0.0.0.0',
    key: undefined,
    passphrase: undefined,
    certificate: undefined,
    advertise: true,
    inspector: {
      enabled: true,
      port: 57484,
      host: '0.0.0.0'
    }
  },
  ports: {
    start: 57485,
    end: 63029
  },
  debug: {
    daemon: false,
    cluster: false
  }
}
