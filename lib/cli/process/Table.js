'use strict'

require('colors')

const stripAnsi = require('strip-ansi')

class Table {
  constructor (emptyMessage) {
    this._rows = []

    this._emptyMessage = emptyMessage
    this._columnLengths = []
  }

  _calculateLengths (data) {
    data.forEach((datum, index) => {
      const length = stripAnsi(`${datum}`).length

      if (!this._columnLengths[index] || length > this._columnLengths[index]) {
        this._columnLengths[index] = length
      }
    })
  }

  addHeader (data) {
    this._calculateLengths(data)

    this._header = data
  }

  addRow (data) {
    this._calculateLengths(data)

    this._rows.push(data)
  }

  toString () {
    if (this._rows.length === 0) {
      return this._emptyMessage.bold
    }

    let output = ''

    if (this._header) {
      let headers = ''

      this._header.forEach((item, index) => {
        headers += `${this._rpad(item, this._columnLengths[index])} `
      })

      output += headers.bold + '\n'
    }

    this._rows.forEach(row => {
      let rows = ''

      row.forEach((item, index) => {
        rows += `${this._rpad(item, this._columnLengths[index])} `
      })

      output += rows + '\n'
    })

    return output
  }

  _rpad (thing, len) {
    if (thing === undefined || thing === null) {
      thing = ''
    } else {
      thing = `${thing}`
    }

    while (stripAnsi(thing).length < len) {
      thing = `${thing} `
    }

    return thing
  }
}

module.exports = Table
