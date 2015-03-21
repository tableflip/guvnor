var expect = require('chai').expect,
  Snapshot = require('../../../../web/client/models/snapshot')

describe('snapshot', function () {
  it('should return formatted size', function () {
    var snapshot = new Snapshot({
      size: 5
    })

    expect(snapshot.sizeFormatted).to.equal('5 Bytes')
  })

  it('should return formatted date', function () {
    var snapshot = new Snapshot({
      date: 10
    })

    // ignore timezone offset..
    expect(snapshot.dateFormatted).to.contain('1970-01-01 01:00:00')
  })
})
