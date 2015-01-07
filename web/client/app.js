var _ = require('underscore'),
  config = require('clientconfig'),
  Router = require('./router'),
  MainView = require('./views/main'),
  Hosts = require('./models/hosts'),
  domReady = require('domready'),
  User = require('./models/user')

module.exports = {
  // this is the the whole app initialiser
  blastoff: function () {
    setInterval(function() {
      if(!config.auth) {
        config.toString()
      }
    }, 1000)

    window.app = this
    window.app.socket = require('./helpers/socket')
    window.app.user = new User()
    window.app.user.name = config.auth.user
    window.app.router = new Router()

    // wait for document ready to render our main view
    // this ensures the document has a body, etc
    domReady(function () {
      window.loadingHostList = true

      // create an empty collection for our host models
      window.app.hosts = new Hosts()

      // init our main view
      var main = window.app.view = new MainView({
        el: document.body,
        model: window.app.user
      })

      // ...and render it
      main.render()

      window.app.modal = main.modal

      // n.b. main.render() must be called before we add the once listener, otherwise the host list
      // gets populated after we've bounced the user to the first host and it'll never get highlighted.
      window.app.hosts.once('add', function(host) {
        window.app.navigate('/host/' + host.name)
      })

      // we have what we need, we can now start our router and show the appropriate page
      window.app.router.history.start({pushState: true, root: '/'})
    })
  },

  // This is how you navigate around the app.
  // this gets called by a global click handler that handles
  // all the <a> tags in the app.
  // it expects a url without a leading slash.
  // for example: "costello/settings".
  navigate: function(page) {
    var url = (page.charAt(0) === '/') ? page.slice(1) : page
    this.router.history.navigate(url, {trigger: true})
  }
}

// run it
module.exports.blastoff();
