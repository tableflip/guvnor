// This view also handles all the 'document' level events such as keyboard shortcuts.
var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')
var CollectionView = require('ampersand-collection-view')
var _ = require('underscore')
var domify = require('domify')
var dom = require('ampersand-dom')
var templates = require('../templates')
var setFavicon = require('favicon-setter')
var HostListView = require('./hostlist/host')
var pkg = require('../../../package.json')
var ModalView = require('./modal')

module.exports = View.extend({
  template: templates.body,
  events: {
    'click a[href]': 'handleLinkClick',
    'click a[href] i': 'handleLinkClickParent',
    'click a[href] span': 'handleLinkClickParent',
    'click [data-hook=toggle-nav]': 'toggleNav',
    'click #nav-shadow': 'hideNavIfShowing'
  },
  subviews: {
    hosts: {
      container: '[data-hook=host-list]',
      prepareView: function (el) {
        return new CollectionView({
            el: el,
            collection: window.app.hosts,
            view: HostListView
          })
      }
    },
    modal: {
      container: '[data-hook=modal]',
      constructor: ModalView
    }
  },
  render: function () {
    // some additional stuff we want to add to the document head
    document.head.appendChild(domify(templates.head()))

    // main renderer
    this.renderWithTemplate()

    // init and configure our page switcher
    this.pageSwitcher = new ViewSwitcher(this.queryByHook('page-container'), {
      show: function (newView, oldView) {
        // it's inserted and rendered for me
        document.title = _.result(newView, 'pageTitle') || 'Guvnor'
        document.scrollTop = 0

        // add a class specifying it's active
        dom.addClass(newView.el, 'active')

        // store an additional reference, just because
        window.app.currentPage = newView
      }
    })
    this.listenTo(window.app.router, 'page', this.pageSwitcher.set.bind(this.pageSwitcher))

    // setting a favicon for fun (note, it's dynamic)
    setFavicon('/images/favicon.png')

    this.query('[data-hook=version]').textContent = pkg.version
  },

  handleLinkClick: function (e) {
    var aTag = e.target
    var local = aTag.host === window.location.host

    // if it's a plain click (no modifier keys)
    // and it's a local url, navigate internally
    if (local && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault()
      window.app.navigate(aTag.pathname)
    }
  },

  handleLinkClickParent: function (e) {
    var aTag = e.target.parentNode
    var local = aTag.host === window.location.host

    // if it's a plain click (no modifier keys)
    // and it's a local url, navigate internally
    if (local && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault()
      window.app.navigate(aTag.pathname)
    }
  },

  setActiveNav: function (href) {
    this.queryAll('.nav .active').forEach(function (aTag) {
      dom.removeClass(aTag, 'active')
    })

    var tag = this.query('.nav a[href="' + href + '"]')

    if (tag) {
      dom.addClass(tag.parentNode, 'active')

      while (tag.parentNode) {
        tag = tag.parentNode

        if (tag.nodeName.toLowerCase() === 'ul') {
          dom.addClass(tag, 'active')
        }
      }
    }
  },

  toggleNav: function () {
    var navBar = this.query('[data-hook=nav-container]')
    var navShadow = this.query('#nav-shadow')
    var classes = Array.prototype.slice.call(navBar.classList)

    if (classes.indexOf('collapse') === -1) {
      classes.push('collapse')
      navShadow.className = ''
    } else {
      classes = classes.filter(function (existingClassName) {
        return existingClassName !== 'collapse'
      })
      navShadow.className = 'shadow'
    }

    navBar.className = classes.join(' ')
  },

  hideNavIfShowing: function () {
    var navBar = this.query('[data-hook=nav-container]')
    var navShadow = this.query('#nav-shadow')
    var classes = Array.prototype.slice.call(navBar.classList)

    if (classes.indexOf('collapse') === -1) {
      classes.push('collapse')
      navShadow.className = ''
    }

    navBar.className = classes.join(' ')
  }
})
