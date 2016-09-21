var coercer = require('coercer')
var commonConfig = require('../common/config')
var config = JSON.parse(JSON.stringify(commonConfig))

// which hosts to connect to
config.HOSTS = (process.env.HOSTS || '').split(',').filter(function (host) {
  return host.trim()
})
config.AUTODISCOVER = process.env.AUTODISCOVER || true

config.HTTPS_PORT = process.env.HTTPS_PORT || 8002
config.HTTPS_HOST = process.env.HTTPS_HOST || 'localhost'
config.HTTPS_ADDRESS = process.env.HTTPS_ADDRESS || '0.0.0.0'

config.HTTPS_CERT = process.env.HTTPS_CERT
config.HTTPS_KEY = process.env.HTTPS_KEY
config.HTTPS_CERT_FILE = process.env.HTTPS_CERT_FILE
config.HTTPS_KEY_FILE = process.env.HTTPS_KEY_FILE

module.exports = Object.freeze(coercer(config))
