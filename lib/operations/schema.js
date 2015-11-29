var Joi = require('joi')
var os = require('os')
var PROCESS_STATUS = require('../common/process-status')

var user = Joi.object({
  name: Joi.string().required(),
  scope: Joi.array().items(Joi.string().valid('user', 'admin')),
  uid: Joi.number().required(),
  gid: Joi.number().required(),
  home: Joi.string().required(),
  group: Joi.string().required(),
  groups: Joi.array().items(Joi.string())
})

var group = Joi.object({
  name: Joi.string().required(),
  gid: Joi.number().required(),
  members: Joi.array().items(Joi.string())
})

var procUser = Joi.object({
  name: Joi.string().required(),
  scope: Joi.array().items(Joi.string().valid('process')),
  script: Joi.string(),
  status: Joi.string().valid(Object.keys(PROCESS_STATUS).map(function (key) {
    return PROCESS_STATUS[key]
  })),
  user: Joi.string(),
  group: Joi.string()
})

var auth = Joi.alternatives()
  .try(user, procUser)
  .label('authentication credentials')

var nameOrId = Joi.alternatives()
  .try(Joi.string(), Joi.number())
  .label('username or id')

var proc = Joi.object({
  name: Joi.string().required(),
  script: Joi.string().required(),
  status: Joi.string().valid(Object.keys(PROCESS_STATUS).map(function (key) {
    return PROCESS_STATUS[key]
  })),
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

var appRef = Joi.object({
  name: Joi.string().required(),
  commit: Joi.string().required(),
  type: Joi.string().valid('branch', 'tag')
})

var app = Joi.object({
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
      1: proc
    })
  },
  findProcess: {
    args: Joi.object({
      0: auth.empty(null),
      1: Joi.string().label('script name').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: proc.empty(null)
    })
  },
  findProcessFingerprint: {
    args: Joi.object({
      0: Joi.string().required(),
      1: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.string()
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
  listProcessStatuses: {
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
  removeProcessFiles: {
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
      1: proc
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
      3: Joi.any().label('output stream'),
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
  },
  updateApp: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('app name').required(),
      2: Joi.any().label('output stream'),
      3: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: app.label('app')
    })
  },
  setAppRef: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('app name').required(),
      2: Joi.string().label('ref').required(),
      3: Joi.any().label('output stream'),
      4: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: app.label('app')
    })
  },
  findUserDetails: {
    args: Joi.object({
      0: auth.empty(null),
      1: nameOrId.required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: user
    })
  },
  findGroupDetails: {
    args: Joi.object({
      0: auth.empty(null),
      1: nameOrId.required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: group
    })
  },
  findUserFingerprint: {
    args: Joi.object({
      0: nameOrId.required(),
      1: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.string()
    })
  },
  listUsers: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.string().label('username').required(),
      2: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.array().items(user)
    })
  },
  getServerStatus: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.object({
        hostname: Joi.string(),
        type: Joi.string(),
        platform: Joi.string(),
        arch: Joi.string(),
        release: Joi.string(),
        guvnor: Joi.string(),
        time: Joi.number(),
        uptime: Joi.number(),
        freeMemory: Joi.number(),
        totalMemory: Joi.number(),
        cpus: Joi.array(),
        versions: Joi.object(),
        os: Joi.string()
      }).label('server status')
    })
  },
  getOs: {
    args: Joi.object({
      0: auth.required(),
      1: Joi.func().label('callback').required()
    }),
    output: Joi.object({
      0: Joi.object().type(Error).empty(null),
      1: Joi.string()
    })
  }
}
