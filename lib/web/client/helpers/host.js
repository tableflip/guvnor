var jquery = require('jquery')
var logger = require('andlog')

var XML_HTTP_REQUEST_STATUSES = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4
}

function update (url) {
  jquery.ajax(url, {
    method: 'GET',
    success: function (data) {
      data = data || {}
      data.url = url
      data.lastUpdated = new Date()
      data.status = 'connected'

      window.app.hosts.add(data, {
        merge: true
      })

      setTimeout(update.bind(null, url), 5000)
    },
    error: function (xmlHttpRequest, textStatus, errorThrown) {
      var data = {
        url: url,
        lastUpdated: new Date(),
        status: 'network-error'
      }

      if (xmlHttpRequest.readyState === XML_HTTP_REQUEST_STATUSES.UNSENT) {
        // encountered a network error
        console.info('network error')
        status = 'network-error'
      } else if (xmlHttpRequest.readyState === XML_HTTP_REQUEST_STATUSES.DONE) {
        // encountered a server error
        console.info('server error')
        status = 'server-error'
      }

      window.app.hosts.add(data, {
        merge: true
      })

      setTimeout(update.bind(null, url), 5000)
    }
  })
}

module.exports = function (url) {
  logger.info('host', url)

  var data = {
    url: url,
    lastUpdated: new Date(),
    status: 'connecting'
  }

  window.app.hosts.add(data, {
    merge: true
  })

  update(url)
}
