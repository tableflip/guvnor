var Joi = require('joi')
var os = require('os')

var user = Joi.object({
  uid: Joi.number().required(),
  gid: Joi.number().required(),
  name: Joi.string().required(),
  home: Joi.string().required(),
  group: Joi.string().required(),
  groups: Joi.array().items(Joi.string()),
  scope: Joi.string().required().valid('user', 'admin')
})

var procUser = Joi.object({
  name: Joi.string(),
  script: Joi.string(),
  status: Joi.string().valid('running', 'stopped', 'unknown', 'error'),
  user: Joi.string(),
  group: Joi.string(),
  scope: Joi.string().valid('process')
})

var auth = Joi.alternatives()
  .try(user, procUser)
  .label('authentication credentials')

var proc = Joi.object({
  name: Joi.string().required(),
  script: Joi.string().required(),
  status: Joi.string().valid('running', 'stopped', 'unknown', 'error').required(),
  user: Joi.string().required(),
  group: Joi.string().required(),
  pid: Joi.number(),
  uid: Joi.number(),
  gid: Joi.number(),
  uptime: Joi.number(),
  cpu: Joi.number(),
  heapTotal: Joi.number(),
  heapUsed: Joi.number(),
  residentSize: Joi.number(),
  time: Joi.number(),
  argv: Joi.array().items(Joi.string()),
  execArgv: Joi.array().items(Joi.string()),
  latency: Joi.number(),
  cwd: Joi.string()
}).label('process')

var heapSnapshot = Joi.object({
  id: Joi.string().required(),
  date: Joi.number().required(),
  path: Joi.string().required(),
  size: Joi.number().required()
}).label('heap snapshot')

var app = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().required()
})

var appRef = Joi.object({
  name: Joi.string().required(),
  commit: Joi.string().required(),
  type: Joi.string().valid('branch', 'tag')
})

module.exports = {
  createProcess: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.object({
        script: Joi.string(),
        cwd: Joi.string(),
        user: Joi.string(),
        group: Joi.string(),
        instances: Joi.number().min(1).max(os.cpus().length),
        name: Joi.string(),
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
      }).label('options').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: proc.required()
    })
  },
  getProcess: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: proc
    })
  },
  listProcessCertificateFingerprints: {
    args: Joi.object({
      0: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.object().pattern(/.*/, proc)
    })
  },
  listProcesses: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null).label('error'),
      1: Joi.array().items(proc).label('process list')
    })
  },
  removeProcess: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null)
    })
  },
  startProcess: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: proc.required()
    })
  },
  stopProcess: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null)
    })
  },
  forceGc: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null)
    })
  },
  fetchHeapSnapshot: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.string().label('snapshot id').required(),
      3: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null)
    })
  },
  listHeapSnapshots: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.array().items(heapSnapshot).label('snapshot list')
    })
  },
  removeHeapSnapshot: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.string().label('snapshot id').required(),
      3: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null)
    })
  },
  takeHeapSnapshot: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: heapSnapshot
    })
  },
  installApp: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('app url').required(),
      2: Joi.object({
        name: Joi.string()
      }).required(),
      3: Joi.any(),
      4: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: app
    })
  },
  removeApp: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('app name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null)
    })
  },
  listApps: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.array().items(app).label('app list')
    })
  },
  listAppRefs: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('app name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.array().items(appRef).label('app ref list')
    })
  },
  findAppRef: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('app name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: appRef.label('app ref')
    })
  }
}
