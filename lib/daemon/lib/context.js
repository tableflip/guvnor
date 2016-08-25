
module.exports = (request) => {
  return {
    id: request.id,
    user: request.auth.credentials,
    log: request.log.bind(request)
  }
}
