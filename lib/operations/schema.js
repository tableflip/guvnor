'use strict'

const Joi = require('joi')
const os = require('os')
const PROCESS_STATUS = require('../common/process-status')

const user = Joi.object({
  name: Joi.string().required(),
  scope: Joi.array().items(Joi.string().valid('user', 'admin')),
  uid: Joi.number().required(),
  gid: Joi.number().required(),
  home: Joi.string().required(),
  group: Joi.string().required(),
  groups: Joi.array().items(Joi.string())
})

const group = Joi.object({
  name: Joi.string().required(),
  gid: Joi.number().required(),
  members: Joi.array().items(Joi.string())
})

const procUser = Joi.object({
  name: Joi.string().required(),
  scope: Joi.array().items(Joi.string().valid('process')),
  script: Joi.string(),
  status: Joi.string().valid(Object.keys(PROCESS_STATUS).map(function (key) {
    return PROCESS_STATUS[key]
  })),
  socket: Joi.string().required()
})

const auth = Joi.alternatives()
  .try(user, procUser)
  .label('authentication credentials')

const context = Joi.object({
  id: Joi.string(),
  user: auth.required(),
  log: Joi.func()
})

const nameOrId = Joi.alternatives()
  .try(Joi.string(), Joi.number())
  .label('username or id')

const procStatus = Joi.object({
  pid: Joi.number(),
  user: Joi.string().required(),
  uid: Joi.number(),
  group: Joi.string().required(),
  gid: Joi.number(),
  uptime: Joi.number(),
  cpu: Joi.number(),
  heapTotal: Joi.number(),
  heapUsed: Joi.number(),
  residentSize: Joi.number(),
  cwd: Joi.string(),
  latency: Joi.number(),
  argv: Joi.array().items(Joi.string()),
  execArgv: Joi.array().items(Joi.string())
}).label('process status')

const proc = Joi.object({
  name: Joi.string().required(),
  script: Joi.string().required(),
  status: Joi.string().valid(Object.keys(PROCESS_STATUS).map(function (key) {
    return PROCESS_STATUS[key]
  })),
  socket: Joi.string().required()
}).label('process')

const procDetails = Joi.object({
  name: Joi.string().required(),
  script: Joi.string().required(),
  status: Joi.string().valid(Object.keys(PROCESS_STATUS).map(function (key) {
    return PROCESS_STATUS[key]
  })),
  socket: Joi.string().required(),
  master: procStatus.when('status', {is: 'running', then: Joi.required()}),
  workers: Joi.array().items(procStatus).when('status', {is: 'running', then: Joi.required()})
}).label('process details')

const heapSnapshot = Joi.object({
  id: Joi.string().required(),
  date: Joi.number().required(),
  path: Joi.string().required(),
  size: Joi.number().required()
}).label('heap snapshot')

const appRef = Joi.object({
  name: Joi.string().required(),
  commit: Joi.string().required(),
  type: Joi.string().valid('branch', 'tag')
})

const app = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().required(),
  path: Joi.string().required(),
  url: Joi.string().required(),
  ref: appRef.required(),
  refs: Joi.array().items(appRef).required(),
  user: Joi.string().required(),
  group: Joi.string().required()
})

module.exports = {
  createProcess: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.object({
        name: Joi.string().required(),
        script: Joi.string(),
        cwd: Joi.string(),
        user: Joi.string(),
        group: Joi.string(),
        workers: Joi.number().min(1).max(os.cpus().length),
        argv: Joi.array(),
        execArgv: Joi.array(),
        debug: Joi.boolean(),
        chroot: Joi.string(),
        interpreter: Joi.string(),
        env: Joi.object().pattern(/.*/, Joi.string().empty('')),
        url: Joi.string().uri({
          scheme: 'https'
        }),
        ca: Joi.string(),
        cert: Joi.string(),
        key: Joi.string()
      }).label('options').required()
    ),
    then: proc
  },
  findProcess: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: proc.required()
  },
  findProcessDetails: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: procDetails.required()
  },
  findProcessFingerprint: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().required()
    ),
    then: Joi.string().required()
  },
  listProcesses: {
    args: Joi.array().sparse().ordered(
      context.required()
    ),
    then: Joi.array().items(proc).label('process list')
  },
  listProcessDetails: {
    args: Joi.array().sparse().ordered(
      context.required()
    ),
    then: Joi.array().items(procDetails).label('detailed process list')
  },
  removeProcess: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: Joi.any().forbidden()
  },
  removeProcessFiles: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: Joi.any().forbidden()
  },
  startProcess: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: proc.required()
  },
  stopProcess: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: proc.required()
  },
  forceGc: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: Joi.any().forbidden()
  },
  fetchHeapSnapshot: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required(),
      Joi.string().label('snapshot id').required(),
      Joi.func().label('on details callback').required(),
      Joi.func().label('on data callback').required()
    ),
    then: Joi.any().forbidden()
  },
  listHeapSnapshots: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: Joi.array().items(heapSnapshot).label('snapshot list')
  },
  removeHeapSnapshot: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required(),
      Joi.string().label('snapshot id').required()
    ),
    then: Joi.any().forbidden()
  },
  takeHeapSnapshot: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required()
    ),
    then: Joi.array().items(heapSnapshot).label('snapshot list')
  },
  fetchLogs: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.object({
        script: Joi.string(),
        follow: Joi.boolean().default(false)
      }).label('options').required()
    ),
    then: Joi.object({
      details: Joi.object(),
      stream: Joi.object()
    })
  },
  watchProcessLogs: {
    args: Joi.array().sparse().ordered(
      context.required()
    ),
    then: Joi.any().forbidden()
  },
  setNumWorkers: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('script name').required(),
      Joi.number().integer().min(1).max(os.cpus().length).label('number of workers').required()
    ),
    then: Joi.any().forbidden()
  },
  installApp: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('app url').required(),
      Joi.object({
        name: Joi.string()
      }).required(),
      Joi.any().label('output stream')
    ),
    then: app.required()
  },
  removeApp: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('app name').required()
    ),
    then: Joi.any().forbidden()
  },
  listApps: {
    args: Joi.array().sparse().ordered(
      context.required()
    ),
    then: Joi.array().items(app).label('app list')
  },
  listAppRefs: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('app name').required()
    ),
    then: Joi.array().items(appRef).label('app ref list')
  },
  findAppRef: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('app name').required()
    ),
    then: appRef.label('app ref')
  },
  findApp: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('app name').required()
    ),
    then: app.label('app').required()
  },
  updateApp: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('app name').required(),
      Joi.any().label('output stream')
    ),
    then: app.label('app').required()
  },
  setAppRef: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('app name').required(),
      Joi.string().label('ref').required(),
      Joi.any().label('output stream')
    ),
    then: app.label('app').required()
  },
  findUserDetails: {
    args: Joi.array().sparse().ordered(
      context.required(),
      nameOrId.required()
    ),
    then: user.required()
  },
  findGroupDetails: {
    args: Joi.array().sparse().ordered(
      context.required(),
      nameOrId.required()
    ),
    then: group.required()
  },
  findUserFingerprint: {
    args: Joi.array().sparse().ordered(
      context.required(),
      nameOrId.required()
    ),
    then: Joi.string().required()
  },
  listUsers: {
    args: Joi.array().sparse().ordered(
      context.required()
    ),
    then: Joi.array().items(user)
  },
  getServerStatus: {
    args: Joi.array().sparse().ordered(
      context.required()
    ),
    then: Joi.object({
      hostname: Joi.string(),
      type: Joi.string(),
      platform: Joi.string(),
      arch: Joi.string(),
      release: Joi.string(),
      daemon: Joi.string(),
      time: Joi.number(),
      uptime: Joi.number(),
      freeMemory: Joi.number(),
      totalMemory: Joi.number(),
      cpus: Joi.array(),
      versions: Joi.object(),
      os: Joi.string()
    }).label('server status').required()
  },
  getOs: {
    args: Joi.array().sparse().ordered(
      context.required()
    ),
    then: Joi.string().required()
  },
  sendEvent: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('Process name').required(),
      Joi.string().label('Event name').required(),
      Joi.array().label('Event arguments').sparse(),
      Joi.string().label('Worker ID')
    ),
    then: Joi.any().forbidden()
  },
  sendSignal: {
    args: Joi.array().sparse().ordered(
      context.required(),
      Joi.string().label('Process name').required(),
      Joi.string().label('Signal').required(),
      Joi.boolean().label('Whether to use kill(signal)').default(false),
      Joi.string().label('Worker ID')
    ),
    then: Joi.any().forbidden()
  }
}
