var View = require('ampersand-view')

var XML_HTTP_REQUEST_STATUS = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4
}

var END_STREAM = require('../../../../../../common/end-stream-marker')

var processResponseText = function (request, callback) {
  var responseText = request.responseText || ''
  var separatorStart = responseText.indexOf(END_STREAM)
  var text = responseText.substring(0, separatorStart === -1 ? responseText.length : separatorStart)

  return callback(text)
}

var processResponseEntity = function (request, callback) {
  var responseText = request.responseText || ''
  var separatorStart = responseText.indexOf(END_STREAM)
  var separatorEnd = separatorStart + END_STREAM.length
  var error
  var entity

  if (separatorStart !== -1 && responseText.length > separatorEnd) {
    try {
      var response = JSON.parse(responseText.substring(separatorEnd))
      error = response[0]
      entity = response[1]
    } catch (e) {
      e.code = 'EPARSE'

      error = e
    }

    return callback(error, entity)
  }

  error = new Error('No entity found')
  error.code = 'ENOENT'

  return callback(error)
}

module.exports = View.extend({
  template: require('./result.hbs'),
  initialize: function (options) {
    this.onBack = options.onBack
    this.onDone = options.onDone

    var view = this
    var model = this.model

    var interval = setInterval(function () {
      processResponseText(options.request, model.set.bind(model, 'text'))
    }, 1000)

    options.request.onload = function () {
      if (this.readyState === XML_HTTP_REQUEST_STATUS.DONE) {
        clearInterval(interval)

        view.queryByHook('preview').style.display = 'none'

        processResponseText(options.request, function (text) {
          model.text = text

          processResponseEntity(options.request, function (error, entity) {
            if (error) {
              if (error.code === 'EPARSE') {
                model.errorHeader = 'Could not parse server response'
                model.errorMessage = error.message + '. This is a bug, please report it.'
              } else if (error.code === 'ENOENT') {
                model.errorHeader = 'Invalid response recieved'
                model.errorMessage = error.message + '. This is a bug, please report it.'
              } else {
                model.errorHeader = error.error
                model.errorMessage = error.message
              }

              view.queryByHook('error-alert').style.display = 'block'

              return
            }

            options.onSuccess(entity)

            view.queryByHook('success-alert').style.display = 'block'
          })
        })
      }
    }
  },
  events: {
    'click [data-hook=back-button]': 'onBack',
    'click [data-hook=done-button]': 'onDone'
  },
  bindings: {
    'model.text': [{
      type: 'text',
      selector: '[data-hook=output-text]'
    }, {
      type: 'toggle',
      selector: '[data-hook=output-text]'
    }, {
      type: function (el, value) {
        el.style.display = value ? 'none' : 'block'
      },
      selector: '[data-hook=preview]'
    }],
    'model.errorHeader': '[data-hook=error-header]',
    'model.errorMessage': '[data-hook=error-message]',
    'model.successHeader': '[data-hook=success-header]',
    'model.successMessage': '[data-hook=success-message]',
    'model.preview': '[data-hook=preview-message]'
  }
})
