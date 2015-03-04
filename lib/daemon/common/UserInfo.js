var Autowire = require('wantsit').Autowire

var UserInfo = function () {
  this._posix = Autowire
}

UserInfo.prototype.afterPropertiesSet = function () {
  var group = this._posix.getgrnam(process.env.GUVNOR_RUN_AS_GROUP || process.getgid())

  this._gid = group.gid
  this._groupname = group.name

  var user = this._posix.getpwnam(process.env.GUVNOR_RUN_AS_USER || process.getuid())

  this._uid = user.uid
  this._username = user.name
}

UserInfo.prototype.getGid = function () {
  return this._gid
}

UserInfo.prototype.getGroupName = function () {
  return this._groupname
}

UserInfo.prototype.getUid = function () {
  return this._uid
}

UserInfo.prototype.getUserName = function () {
  return this._username
}

module.exports = UserInfo
