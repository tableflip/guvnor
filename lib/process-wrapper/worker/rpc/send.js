
module.exports = function send () {
  var args = Array.prototype.slice.call(arguments)
  var callback = args[args.length - 1]

  if (typeof callback === 'function') {
    args.length--
  } else {
    callback = function () {}
  }

  process.emit.apply(process, arguments)

  callback()
}
