
/**
 * I am either a TCP connection or a Unix Sockets connection
 */
var Connection = function(options) {
	if(options.socket) {
		// set up socket
	} else if(options.url) {
		// set up url
	} else {
		throw new Error("Please specify either a socket or url to connect to");
	}
}

module.exports = Connection;
