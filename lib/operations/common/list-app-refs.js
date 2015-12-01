var findApp = require('./lib/find-app')

module.exports = function listAppRefs (user, name, callback) {
  findApp(user, name, function (error, app) {
    callback(error, error ? null : app.refs)
  })
}
