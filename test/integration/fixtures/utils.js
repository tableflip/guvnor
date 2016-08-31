'use strict'

const onProcessEvent = (event, name, api) => {
  const promise = new Promise((resolve, reject) => {
    const listener = function (host, proc, arg0, arg1, arg2, etc) {
      if (proc.name !== name) {
        return
      }

      api.removeListener(event, listener)

      resolve({
        host: host,
        proc: proc,
        event: event,
        args: Array.prototype.slice.call(arguments, 2)
      })
    }

    api.on(event, listener)
  })

  return () => promise
}

const isProc = (t, name, status, proc) => {
  if (!proc) {
    throw new Error('proc expected, got', proc)
  }

  t.is(proc.name, name)
  t.is(proc.status, status)
}

module.exports = {
  onProcessEvent: onProcessEvent,
  isProc: isProc
}
