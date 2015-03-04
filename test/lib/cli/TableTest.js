var expect = require('chai').expect,
  sinon = require('sinon'),
  Table = require('../../../lib/cli/Table')

describe('Table', function () {
  var table

  beforeEach(function () {
    table = new Table('empty')
  })

  it('should return a message when the table is empty', function (done) {
    table.print(function (output) {
      expect(output).to.contain('empty')

      done()
    })
  })

  it('should update lengths when adding a header', function () {
    table.addHeader(['foo', 'barbar', 'bazbazbaz'])

    expect(table._columnLengths[0]).to.equal(3)
    expect(table._columnLengths[1]).to.equal(6)
    expect(table._columnLengths[2]).to.equal(9)
  })

  it('should update lengths when adding a row', function () {
    table.addRow(['foo', 'barbar', 'bazbazbaz'])

    expect(table._columnLengths[0]).to.equal(3)
    expect(table._columnLengths[1]).to.equal(6)
    expect(table._columnLengths[2]).to.equal(9)
  })

  it('should choose the longer of two column entries', function () {
    table.addRow(['foofoofoo'])
    table.addRow(['bar'])

    expect(table._columnLengths[0]).to.equal(9)
  })

  it('should print a table', function (done) {
    table.addHeader(['foo'])
    table.addRow(['barbar'])
    table.addRow(['bazbaz'])

    expect(table._columnLengths[0]).to.equal(6)

    var row = 0

    table.print(function (output) {
      if (row == 0) {
        expect(output).to.contain('foo')
      } else if (row == 1) {
        expect(output).to.contain('barbar')
      } else if (row == 2) {
        expect(output).to.contain('bazbaz')

        done()
      }

      row++
    })
  })
})
