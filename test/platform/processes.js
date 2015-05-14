var Hapi = require('hapi')
var Joi = require('joi')
var Boom = require('boom')
var fs = require('fs')
var path = require('path')

var PORT = 26372

module.exports = function startProcessServer (callback) {
  var processes = []
  var lastPid = 3892

  fs.readFileSync(path.join(__dirname, 'process-names.txt'), {
    encoding: 'utf8'
  }).trim().split('\n').forEach(function (line) {
    line = line.trim()
    var parts = line.split('\t')

    processes.push({
      pid: parts[0] === '-' ? undefined : parseInt(parts[0], 10),
      status: parseInt(parts[1], 10),
      name: parts[2]
    })
  })

  var server = new Hapi.Server()
  server.connection({
    port: PORT
  })
  server.route({
    method: 'GET',
    path: '/processes',
    handler: function (request, reply) {
      return reply(processes)
    }
  })
  server.route({
    method: 'POST',
    path: '/processes',
    handler: function (request, reply) {
      processes.push({
        name: request.payload.name,
        status: 0
      })

      return reply().code(201)
    },
    config: {
      validate: {
        payload: {
          name: Joi.string().required()
        }
      }
    }
  })
  server.route({
    method: 'PUT',
    path: '/processes/{name}',
    handler: function (request, reply) {
      var proc = processes.filter(function (proc) {
        return proc.name === request.params.name
      }).pop()

      if (!proc) {
        return reply(Boom.notFound('No process found with name ' + request.params.name))
      }

      if (request.payload.running) {
        proc.status = 0
        proc.pid = lastPid
        lastPid++
      }

      if (request.payload.exitCode) {
        proc.status = request.payload.exitCode
        proc.pid = null
      }

      return reply(proc)
    },
    config: {
      validate: {
        payload: {
          running: Joi.boolean(),
          exitCode: Joi.number()
        }
      }
    }
  })
  server.route({
    method: 'DELETE',
    path: '/processes/{name}',
    handler: function (request, reply) {
      processes = processes.filter(function (proc) {
        return proc.name !== request.params.name
      })

      return reply().code(201)
    }
  })
  server.start(function (error) {
    callback(error, server.stop.bind(server))
  })
}
