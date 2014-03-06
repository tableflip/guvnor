
var Container = require("wantsit").Container;

var container = new Container();
container.createAndRegister("cli", require(__dirname + "/lib/CLI"));
container.createAndRegister("connection", require(__dirname + "/lib/api/Connection"), {
	socket: "/tmp/boss"
});
