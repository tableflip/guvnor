var commander = require("commander"),
	pkg = require("../package.json"),
	path = require("path"),
	Autowire = require("wantsit").Autowire,
	suit = require("./suit");

var CLI = function() {
	this._boss = Autowire;
};

CLI.prototype.afterPropertiesSet = function() {

	commander
		.version(pkg.version);

	commander
		.command("list")
		.description("List all running processes")
		.action(this.list.bind(this));

	commander
		.command("start <script>")
		.description("Start a process")
		.option("-u, --user <user>", "The user to start a process as")
		.option("-g, --group <group>", "The group to start a process as")
		.option("-i, --instances <instances>", "How many instances of the process to start", parseInt)
		.option("-n, --name <name>", "What name to give the process")
		.action(this.start.bind(this));

	commander
		.command("cluster <name>")
		.description("Manage clustered processes")
		.option("-w, --workers", "Set how many workers this cluster should have")
		.action(this.cluster.bind(this));

	commander
		.command("stop [name]")
		.description("Stop a process")
		.action(this.stop.bind(this));

	commander
		.command("kill")
		.description("Stop all processes and kill the daemon")
		.action(this.kill.bind(this));

	commander
		.command("key")
		.description("Manage client RSA keys")
		.action(this.key.bind(this))
			.command("add")
				.option("-n, --name", "A key name")
				.option("-k, --key", "The path to the key")
				.description("Add a key")
				.action(this.key.bind(this))
			.command("rm")
				.option("-n, --name", "A key name")
				.description("Remove a key")
				.action(this.key.bind(this))
			.command("list")
				.description("List the keys")
				.action(this.key.bind(this));

	commander.on('--help', function() {
		console.log(suit)
	});

	commander
		.command("*")
		.action(this.unknown.bind(this));

	var program = commander.parse(process.argv);

	// No command
	if(!program.args[0]) {
		this.list()
	}
}

function rpad(thing, len) {
	if (thing === undefined || thing === null) {
		thing = ""
	} else {
		thing = thing + ""
	}

	while (thing.length < len) {
		thing = thing + " "
	}

	return thing
}

CLI.prototype.list = function() {
	this._boss.invoke(function() {
		this._boss.listProcesses(function(error, processes) {
			if(!processes.length) {
				console.info("\u001b[1mNo running processes\u001b[22m");
			} else {
				var lengths = {pid: 0, title: 0, uptime: 0, memory: 0, cpu: 0};

				// Min lengths should be equal to the column title
				Object.keys(lengths).forEach(function(key) {
					lengths[key] = key.length
				});

				processes.forEach(function(proc) {
					var title = proc.title || "?",
						uptime = proc.uptime !== undefined ? proc.uptime : "?",
						memory = proc.usage ? proc.usage.memory.rss : "?",
						cpu = proc.usage ? proc.usage.cpu : "?";

					var pidLen = (proc.pid + "").length;
					lengths.pid = pidLen > lengths.pid ? pidLen : lengths.pid;

					var titleLen = (title + "").length;
					lengths.title = titleLen > lengths.title ? titleLen : lengths.title;

					var uptimeLen = (uptime + "").length;
					lengths.uptime = uptimeLen > lengths.uptime ? uptimeLen : lengths.uptime;

					var memLen = (memory + "").length;
					lengths.memory = memLen > lengths.memory ? memLen : lengths.memory;

					var cpuLen = (cpu + "").length;
					lengths.cpu = cpuLen > lengths.cpu ? cpuLen : lengths.cpu;
				});

				console.log(
					"\u001b[1m" +
					rpad("pid", lengths.pid) + " " +
					rpad("title", lengths.title) + " " +
					rpad("uptime", lengths.uptime) + " " +
					rpad("memory", lengths.memory) + " " +
					rpad("cpu", lengths.cpu) +
					"\u001b[22m"
				);

				processes.forEach(function(proc) {
					var title = proc.title || "?",
						uptime = proc.uptime !== undefined ? proc.uptime : "?",
						memory = proc.usage ? proc.usage.memory.rss : "?",
						cpu = proc.usage ? proc.usage.cpu : "?";

					console.log(
						rpad(proc.pid, lengths.pid) + " " +
						rpad(title, lengths.title) + " " +
						rpad(uptime, lengths.uptime) + " " +
						rpad(memory, lengths.memory) + " " +
						rpad(cpu, lengths.cpu)
					);
				});
			}
			process.exit(0);
		});
	}.bind(this));
};

CLI.prototype.start = function(script, options) {
	script = path.resolve(script);

	this._boss.invoke(function() {
		this._boss.startProcess(script, options, function(error) {
			if(error) {
				console.error(error);
			}

			process.exit(0);
		});
	}.bind(this));
};

CLI.prototype.stop = function() {

};

CLI.prototype.cluster = function(name, options) {

};

CLI.prototype.kill = function() {
	this._boss.invoke(function() {
		this._boss.kill();

		process.exit(0);
	}.bind(this));
};

CLI.prototype.key = function() {

};

CLI.prototype.unknown = function() {
	console.info("Please specify a known subcommand. See 'bs --help' for commands.");
	process.exit(0);
};

module.exports = CLI;
