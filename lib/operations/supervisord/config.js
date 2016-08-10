'use strict'

module.exports = Object.freeze({
  CONFIG_FILE: process.env.SUPERVISORD_CONFIG_FILE || '/etc/supervisor/conf.d/supervisord.conf'
})
