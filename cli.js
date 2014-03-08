var Container = require("wantsit").Container,
	path = require("path");

var config = require("rc")("boss", path.resolve(__dirname, ".bossrc"));

var container = new Container();
container.register("config", config);
container.createAndRegister("cli", require(path.resolve(__dirname, "lib/CLI")));
container.createAndRegister("boss", require(path.resolve(__dirname, "lib/DaemonStarter")), config.boss.socket, path.resolve(__dirname, "boss.js"));
