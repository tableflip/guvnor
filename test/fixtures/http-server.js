var http = require('http');
var port = process.env.PORT || 9000;

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('DERP DERP');
}).listen(port);

console.log('Server listening on ' + port);