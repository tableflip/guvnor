require('stackup')
require('heapdump')

var cluster = require('cluster')

if(cluster.isWorker) {
  return require('./process')
}

var ClusterManager = require('./ClusterManager')

new ClusterManager()
