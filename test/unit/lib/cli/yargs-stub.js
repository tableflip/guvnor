var sinon = require('sinon')

module.exports = function () {
  var yargs = {
    usage: sinon.stub(),
    demand: sinon.stub(),
    example: sinon.stub(),
    help: sinon.stub(),
    alias: sinon.stub(),
    boolean: sinon.stub(),
    epilog: sinon.stub(),
    describe: sinon.stub(),
    default: sinon.stub(),
    array: sinon.stub(),
    command: sinon.stub(),
    argv: {
      _: []
    }
  }
  yargs.usage.returns(yargs)
  yargs.demand.returns(yargs)
  yargs.example.returns(yargs)
  yargs.help.returns(yargs)
  yargs.alias.returns(yargs)
  yargs.boolean.returns(yargs)
  yargs.epilog.returns(yargs)
  yargs.describe.returns(yargs)
  yargs.default.returns(yargs)
  yargs.array.returns(yargs)
  yargs.command.returns(yargs)

  return yargs
}
