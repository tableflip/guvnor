var config = require('clientconfig')
var Router = require('./router')
var MainView = require('./views/main')
var Hosts = require('./models/hosts')
var domReady = require('domready')
var app = require('ampersand-app')

global.jQuery = require('jquery')
require('bootstrap/dist/js/bootstrap')
delete global.jQuery

app.extend({
  // this is the the whole app initialiser
  init: function () {
    setInterval(function () {
      if (!config.auth) {
        config.toString()
      }
    }, 1000)

    this.socket = require('./helpers/socket')
    this.router = new Router()

    // wait for document ready to render our main view
    // this ensures the document has a body, etc
    domReady(function () {
      this.loadingHostList = true

      // create an empty collection for our host models
      this.hosts = new Hosts()

      // init our main view
      this.view = new MainView({
        el: document.body
      })

      // ...and render it
      this.view.render()

      this.modal = this.view.modal

      // n.b. main.render() must be called before we add the once listener, otherwise the host list
      // gets populated after we've bounced the user to the first host and it'll never get highlighted.
      this.hosts.once('add', function (host) {
        this.navigate('/host/' + host.name)
      }.bind(this))

      // we have what we need, we can now start our router and show the appropriate page
      this.router.history.start()
    }.bind(this))
  },

  // This is how you navigate around the app.
  // this gets called by a global click handler that handles
  // all the <a> tags in the app.
  // it expects a url without a leading slash.
  // for example: "costello/settings".
  navigate: function (page) {
    var url = (page.charAt(0) === '/') ? page.slice(1) : page
    this.router.history.navigate(url, {trigger: true})
  }
})

// run it
app.init()
