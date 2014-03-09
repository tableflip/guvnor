var Container = require("wantsit").Container,
	path = require("path");

var config = require("rc")("boss", path.resolve(__dirname, ".bossrc"));

var container = new Container();
container.register("config", config);
container.createAndRegister("process", require("./lib/ProcessRPC"));
