var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('operations/darwin/find-user-details', function () {
  var fs
  var plist
  var findUserDetails
  var users = [{
    'dsAttrTypeStandard:NFSHomeDirectory': ['/var/root', '/private/var/root'],
    'dsAttrTypeStandard:PrimaryGroupID': ['0'],
    'dsAttrTypeStandard:RecordName': ['root'],
    'dsAttrTypeStandard:UniqueID': ['0']
  }, {
    'dsAttrTypeStandard:NFSHomeDirectory': ['/Users/bob'],
    'dsAttrTypeStandard:PrimaryGroupID': ['20'],
    'dsAttrTypeStandard:RecordName': ['bob', 'bob@gmail.com'],
    'dsAttrTypeStandard:UniqueID': ['501']
  }, {
    'dsAttrTypeStandard:NFSHomeDirectory': ['/var/xgrid/controller'],
    'dsAttrTypeStandard:PrimaryGroupID': ['85'],
    'dsAttrTypeStandard:RecordName': ['_xgridcontroller', 'xgridcontroller'],
    'dsAttrTypeStandard:UniqueID': ['85']
  }]

  var groups = [{
    'dsAttrTypeStandard:PrimaryGroupID': ['103'],
    'dsAttrTypeStandard:RecordName': ['bob']
  }, {
    'dsAttrTypeStandard:GroupMembership': ['root', 'dave'],
    'dsAttrTypeStandard:PrimaryGroupID': ['20'],
    'dsAttrTypeStandard:RecordName': ['staff', 'BUILTIN\\Users']
  }, {
    'dsAttrTypeStandard:GroupMembership': ['root', 'bob'],
    'dsAttrTypeStandard:PrimaryGroupID': ['80'],
    'dsAttrTypeStandard:RecordName': ['admin', 'BUILTIN\\Administrators']
  }, {
    'dsAttrTypeStandard:GroupMembership': ['_spotlight', 'bob'],
    'dsAttrTypeStandard:PrimaryGroupID': ['402'],
    'dsAttrTypeStandard:RecordName': ['com.apple.sharepoint.group.1']
  }, {
    'dsAttrTypeStandard:GroupMembership': ['dave', 'bob'],
    'dsAttrTypeStandard:PrimaryGroupID': ['98'],
    'dsAttrTypeStandard:RecordName': ['_lpadmin', 'lpadmin', 'BUILTIN\\Print Operators']
  }]

  beforeEach(function () {
    child_process = {
      execFile: sinon.stub()
    }
    plist = {
      parse: sinon.stub()
    }

    child_process.execFile.withArgs('dscl', ['-plist', '.', 'readall', '/users', 'UniqueID', 'PrimaryGroupID', 'RecordName', 'NFSHomeDirectory']).callsArgWith(2, null, 'user-list')
    plist.parse.withArgs('user-list').returns(users)

    child_process.execFile.withArgs('dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership']).callsArgWith(2, null, 'group-list')
    plist.parse.withArgs('group-list').returns(groups)

    findUserDetails = proxyquire('../../../../../lib/operations/darwin/find-user-details', {
      'child_process': child_process,
      'plist': plist
    })
  })

  it('should find user details with string', function (done) {
    findUserDetails({}, 'bob', function (error, user) {
      expect(error).to.not.exist

      expect(user.name).to.equal('bob')
      expect(user.uid).to.equal(501)
      expect(user.gid).to.equal(20)
      expect(user.home).to.equal('/Users/bob')
      expect(user.group).to.equal('staff')
      expect(user.groups).to.contain('admin')
      expect(user.groups).to.contain('com.apple.sharepoint.group.1')
      expect(user.groups).to.contain('lpadmin')

      done()
    })
  })

  it('should find user details with number', function (done) {
    findUserDetails({}, 501, function (error, user) {
      expect(error).to.not.exist

      expect(user.name).to.equal('bob')
      expect(user.uid).to.equal(501)
      expect(user.gid).to.equal(20)
      expect(user.home).to.equal('/Users/bob')
      expect(user.group).to.equal('staff')
      expect(user.groups).to.contain('admin')
      expect(user.groups).to.contain('com.apple.sharepoint.group.1')
      expect(user.groups).to.contain('lpadmin')

      done()
    })
  })
})
