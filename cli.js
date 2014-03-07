var Container = require("wantsit").Container,
	path = require("path");

var config = require("rc")("boss");

var container = new Container();
container.register("config", config);
container.createAndRegister("cli", require(path.resolve("lib/CLI")));
container.createAndRegister("boss", require(path.resolve("lib/DaemonStarter")), config.boss.socket, path.resolve(__dirname, "boss.js"));
