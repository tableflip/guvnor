'use strict'

const retry = (operation, retries, delay) => {
    return operation().
      catch(error => {
        if (retries === 0) {
          throw error
        }

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            retry(operation, retries - 1, delay)
            .then(resolve)
            .catch(reject)
          }, delay)
        })
    });
}

module.exports = retry
