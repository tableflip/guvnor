var commander = require('commander')


// monkey patch until https://github.com/tj/commander.js/issues/289 is resolved
commander.normalize = function(args) {
  var ret = []
    , arg
    , lastOpt
    , index
    , subcommand;

  // find subcommand - horrifically naive - just look for the first argument
  // not prefixed with a dash
  for (var i = 0, len = args.length; i < len; ++i) {
    if(args[i].substring(0, 1) != '-') {
      subcommand = this.findCommand(args[i])

      break
    }
  }

  for (var i = 0, len = args.length; i < len; ++i) {
    arg = args[i];
    if (i > 0) {
      lastOpt = this.optionFor(subcommand, args[i-1]);
    }

    if (arg === '--') {
      // Honor option terminator
      ret = ret.concat(args.slice(i));
      break;
    } else if (lastOpt && lastOpt.required) {
      ret.push(arg);
    } else if (arg.length > 1 && '-' == arg[0] && '-' != arg[1]) {
      arg.slice(1).split('').forEach(function(c) {
        ret.push('-' + c);
      });
    } else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
      ret.push(arg.slice(0, index), arg.slice(index + 1));
    } else {
      ret.push(arg);
    }
  }

  return ret;
};

commander.findCommand = function(subcommand) {
  if(!subcommand) {
    return
  }

  for(var i = 0; i < this.commands.length; i++) {
    if(this.commands[i]._name == subcommand) {
      return this.commands[i]
    }
  }
}

commander.optionFor = function(subcommand, arg) {
  var options = this.options

  if(arguments.length == 1) {
    // invoked as 'bs --foo'
    arg = subcommand
  } else {
    // invoked as 'bs foo --bar'
    options = subcommand.options
  }

  for (var i = 0, len = options.length; i < len; ++i) {
    if (options[i].is(arg)) {
      return options[i];
    }
  }
}

module.exports = commander