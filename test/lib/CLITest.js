var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  proxyquire = require('proxyquire')

var stubs = {}
var CLI = proxyquire(path.resolve(__dirname, '../../lib/CLI'), stubs)
var cli = new CLI()

describe('CLI', function() {
  describe('_parseList', function() {
    it('should parse list of arguments', function() {
      var list = cli._parseList('--foo')
      expect(list).to.contain('--foo')
    })

    it('should parse list of arguments with multiple arguments', function() {
      var list = cli._parseList('--foo --bar')
      expect(list).to.contain('--foo')
      expect(list).to.contain('--bar')
    })

/*    it('should parse list of arguments with delimited multiple arguments', function() {
      var list = cli._parseList('--foo="baz, qux" --bar')
      expect(list).to.contain('--foo="baz, qux"')
      expect(list).to.contain('--bar')
    })

    it('should parse list of arguments with nested delimited multiple arguments', function() {
      var list = cli._parseList('--foo="baz, \'qux\'" --bar')
      expect(list).to.contain('--foo="baz, \'qux\'"')
      expect(list).to.contain('--bar')
    })

    it('should parse list of arguments with unmatched nested delimited multiple arguments', function() {
      var list = cli._parseList('--foo="baz, \'qux" --bar')
      expect(list).to.contain('--foo="baz, \'qux"')
      expect(list).to.contain('--bar')
    })
*/
    it('should parse list of short arguments with multiple arguments', function() {
      var list = cli._parseList('-f 1 -b 2')
      expect(list).to.contain('-f')
      expect(list).to.contain('1')
      expect(list).to.contain('-b')
      expect(list).to.contain('2')
    })
  })
})
