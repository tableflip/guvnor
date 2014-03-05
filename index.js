
var commander = require("commander"),
	pkg = require(__dirname + "/package.json");

commander
	.version(pkg.version);

commander
	.command("list")
	.description("List all running processes")
	.action(function() {

	});

commander
	.command("start [name]")
	.description("Start a process")
	.option("-u, --user", "The user to start a process as")
	.option("-g, --group", "The group to start a process as")
	.action(function() {

	});

commander
	.command("stop [name]")
	.description("Stop a process")
	.action(function() {

	});

commander
	.command("kill")
	.description("Stop all processes and kill the daemon")
	.action(function() {

	});

commander.parse(process.argv);
