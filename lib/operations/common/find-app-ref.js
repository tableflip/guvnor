var findApp = require('./lib/find-app')

module.exports = function findAppRef (context, name, callback) {
  findApp(context, name, function (error, app) {
    callback(error, error ? null : app.ref)
  })
}
