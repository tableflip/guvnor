var expect = require('chai').expect,
  RemoteUser = require('../../../../lib/daemon/domain/RemoteUser')

describe('RemoteUser', function () {
  it('should set name and secret from options', function () {
    var options = {
      name: 'foo',
      secret: 'bar'
    }
    var remoteUser = new RemoteUser(options)

    expect(remoteUser.name).to.equal(options.name)
    expect(remoteUser.secret).to.equal(options.secret)
  })
})
