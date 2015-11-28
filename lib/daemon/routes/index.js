var async = require('async')

module.exports = function routes (server, callback) {
  var tasks = [];

  [
    './certificates/ca/get',
    './certificates/user/delete',
    './certificates/user/post',
    './apps/get',
    './apps/post',
    './apps/name/delete',
    './apps/name/ref/get',
    './apps/name/refs/get',
    './apps/name/refs/put',
    './get',
    './processes/get',
    './processes/post',
    './processes/name/delete',
    './processes/name/get',
    './processes/name/put',
    './processes/name/events/post',
    './processes/name/gc/post',
    './processes/name/heapsnapshot/get',
    './processes/name/heapsnapshot/post',
    './processes/name/heapsnapshot/id/delete',
    './processes/name/heapsnapshot/id/get'
  ].forEach(function route (routePath) {
    tasks.push(function addRoute (next) {
      require(routePath)(server, next)
    })
  })

  async.parallel(tasks, callback)
}
