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

  print (func) {
    if (this._rows.length === 0) {
      return func(this._emptyMessage.bold)
    }

    if (this._header) {
      let output = ''

      this._header.forEach((item, index) => {
        output += `${this._rpad(item, this._columnLengths[index])} `
      })

      func(output.bold)
    }

    this._rows.forEach((row) => {
      let output = ''

      row.forEach((item, index) => {
        output += `${this._rpad(item, this._columnLengths[index])} `
      })

      output += ''

      func(output)
    })
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
