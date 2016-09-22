'use strict'

const mapSeries = (list) => {
  const output = []
  let errored = false

  return new Promise((resolve, reject) => {
    list.reduce((last, current, index) => {
      if (errored) {
        return
      }

      return last
      .then(result => {
        return current(result)
        .catch(error => {
          errored = true

          reject(error)
        })
        .then(result => {
          if (errored) {
            return
          }

          output[index] = result

          return result
        })
      })
    }, Promise.resolve())
    .then(() => resolve(output))
  })
}

const series = (list) => {
  return mapSeries(list)
  .then(results => {
    return results.pop()
  })
}

const spread = (list, handler) => {
  return handler.apply(null, list)
}

module.exports = {
  series: series,
  mapSeries: mapSeries,
  spread: spread
}
