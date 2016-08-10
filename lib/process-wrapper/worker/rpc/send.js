'use strict'

module.exports = function send () {
  const args = Array.prototype.slice.call(arguments)
  let callback = args[args.length - 1]

  if (typeof callback === 'function') {
    args.length--
  } else {
    callback = function () {}
  }

  process.emit.apply(process, arguments)

  callback()
}
