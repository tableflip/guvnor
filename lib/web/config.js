var coercer = require('coercer')

var config = {
  // which hosts to connect to
  HOSTS: (process.env.GUVNOR_HOSTS || '').split(','),
  AUTODISCOVER: process.env.GUVNOR_AUTODISCOVER || true,

  HTTPS_PORT: process.env.GUVNOR_HTTPS_PORT || 8080,
  HTTPS_HOST: process.env.GUVNOR_HTTPS_HOST || 'localhost',
  HTTPS_ADDRESS: process.env.GUVNOR_HTTPS_ADDRESS || '0.0.0.0',

  HTTPS_CERT: process.env.GUVNOR_HTTPS_CERT,
  HTTPS_KEY: process.env.GUVNOR_HTTPS_KEY,
  HTTPS_CERT_FILE: process.env.GUVNOR_HTTPS_CERT_FILE,
  HTTPS_KEY_FILE: process.env.GUVNOR_HTTPS_KEY_FILE
}

module.exports = Object.freeze(coercer(config))
