
module.exports = (request) => {
  return {
    user: request.auth.credentials,
    log: request.log.bind(request)
  }
}
