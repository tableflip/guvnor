var jquery = require('jquery')
var logger = require('andlog')
var url = require('url')
var app = require('ampersand-app')

var XML_HTTP_REQUEST_STATUSES = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4
}

function update (data) {
  jquery.ajax(data.url, {
    method: 'GET',
    success: function (result) {
      for (var key in result) {
        data[key] = result[key]
      }

      data.lastUpdated = new Date()
      data.status = 'connected'

      setTimeout(update.bind(null, data), 5000)
    },
    error: function (xmlHttpRequest, textStatus, errorThrown) {
      data.lastUpdated = new Date()

      if (xmlHttpRequest.readyState === XML_HTTP_REQUEST_STATUSES.UNSENT) {
        // encountered a network error
        logger.warn('network error', data.url)
        data.status = 'network-error'
      } else if (xmlHttpRequest.readyState === XML_HTTP_REQUEST_STATUSES.DONE) {
        // encountered a server error
        logger.warn('server error', data.url)
        data.status = 'server-error'
      }

      setTimeout(update.bind(null, data), 5000)
    }
  })
}

module.exports = function monitorRemoteHost (remote) {
  var data = {
    name: url.parse(remote).host,
    url: remote,
    lastUpdated: new Date(),
    status: 'connecting'
  }

  logger.info('adding host', remote, data)

  data = app.hosts.add(data, {
    merge: true
  })

  update(data)
}
