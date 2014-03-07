var Container = require("wantsit").Container,
	path = require("path");

var config = require("rc")("boss");

var container = new Container();
container.register("config", config);
container.createAndRegister("boss", require(path.resolve("lib/BossRPC")));
container.createAndRegister("processStarter", require(path.resolve("lib/DaemonStarter")), config.process.socket, path.resolve(__dirname, "process.js"));
