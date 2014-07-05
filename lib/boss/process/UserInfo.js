var Autowire = require('wantsit').Autowire

var UserInfo = function() {
  this._posix = Autowire
}

UserInfo.prototype.afterPropertiesSet = function() {
  this._group = this._posix.getgrnam(this._intOrString(process.env.BOSS_RUN_AS_GROUP))
  this._user = this._posix.getpwnam(this._intOrString(process.env.BOSS_RUN_AS_USER))
}

UserInfo.prototype._intOrString = function(value) {
  var output = parseInt(value, 10)

  return isNaN(output) ? value : output
}

UserInfo.prototype.getGid = function() {
  return this._group.gid
}

UserInfo.prototype.getGroupName = function() {
  return this._group.name
}

UserInfo.prototype.getUid = function() {
  return this._user.uid
}

UserInfo.prototype.getUserName = function() {
  return this._user.name
}

module.exports = UserInfo
