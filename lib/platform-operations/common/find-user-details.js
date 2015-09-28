var platformOperations = require('../')

module.exports = function findUserDetails (nameOrId, callback) {
  platformOperations.listUsers(function (error, users) {
    var output

    if (!error) {
      users.some(function (user) {
        if (user.name === nameOrId || user.uid === nameOrId) {
          output = user

          return true
        }

        return false
      })
    }

    callback(error, output)
  })
}
