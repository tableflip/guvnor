'use strict'

const Good = require('good')

const addLogging = (context, server) => {
  return new Promise((resolve, reject) => {
    server.register({
      register: Good,
      options: {
        reporters: {
          enough: [{
            module: 'good-enough',
            args: [{
              events: {
                error: '*',
                log: '*',
                request: '*',
                response: '*' //,
                //wreck: '*',
                //ops: '*'
              }
            }]
          }]
        }
      }
    })

    resolve()
  })
}

module.exports = addLogging
