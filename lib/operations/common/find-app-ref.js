var findApp = require('./lib/find-app')

module.exports = function findAppRef (user, name, callback) {
  findApp(user, name, function (error, app) {
    callback(error, error ? null : app.ref)
  })
}
