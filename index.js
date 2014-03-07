
var Container = require("wantsit").Container,
	path = require("path"),
	pkg = require(path.resolve("package.json"))

var container = new Container();
container.register("config", require("rc")(pkg.name, {
	socket: "/tmp/boss-ps"
}));
container.createAndRegister("cli", require(path.resolve("lib/CLI")));
container.createAndRegister("connection", require(path.resolve("lib/ProcessStarter")));
