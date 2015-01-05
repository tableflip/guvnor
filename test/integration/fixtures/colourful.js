var colors = require('colors')

var colours = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'grey']
var text = [
  'Wow',
  'Such colour',
  'So bright',
  'Joy',
  'Too much!',
  'Many shades',
  'Rainbo'
]

function rand(arr) {
  return arr[Math.floor(Math.random()*arr.length)]
}

setInterval(function() {
  console.log(rand(text)[rand(colours)])
}, 1000)