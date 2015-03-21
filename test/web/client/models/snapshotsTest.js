var expect = require('chai').expect,
  Snapshots = require('../../../../web/client/models/snapshots')

describe('snapshots', function () {
  it('should format url correctly', function () {
    var snapshots = new Snapshots()
    snapshots.parent = {
      id: 'bar',
      collection: {
        parent: {
          name: 'foo'
        }
      }
    }

    expect(snapshots.url()).to.equal('/hosts/foo/processes/bar/snapshots')
  })
})
