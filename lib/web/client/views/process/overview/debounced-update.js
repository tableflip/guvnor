
module.exports = function (view, doUpdate) {
  var update

  view.listenTo(view.model, 'change', function () {
    clearTimeout(update)
    update = setTimeout(doUpdate, 100)
  })

  doUpdate()
}
