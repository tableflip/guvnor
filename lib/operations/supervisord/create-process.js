/*
// /etc/supervisor/conf.d/supervisord.conf

[supervisord]
nodaemon=true

[program:node]
command=/usr/local/bin/node /var/www/hapiproject/server.js
directory=/var/www/hapiproject
autostart=true
autorestart=true
 */

module.exports = function (user, options, callback) {

  callback()
}
