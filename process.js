var Container = require("wantsit").Container,
	path = require("path");

var config = require("rc")("boss");

var container = new Container();
container.register("config", config);
container.createAndRegister("process", require(path.resolve("lib/ProcessRPC")));
