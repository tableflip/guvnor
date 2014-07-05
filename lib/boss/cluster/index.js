require('stackup')
require('heapdump')

var cluster = require('cluster')

if(cluster.isWorker) {
  return require('./../process/index')
}

var ClusterManager = require('./ClusterManager')

new ClusterManager()
