
var LINE_LENGTH = 64

module.exports = function (prefix, suffix, contents) {
  contents = contents.substring(prefix.length)
  contents = contents.substring(0, contents.length - suffix.length)

  var output = prefix

  for (var i = 0; i < contents.length; i += LINE_LENGTH) {
    output += '\n' + contents.substring(i, i + LINE_LENGTH)
  }

  return output + '\n' + suffix
}
