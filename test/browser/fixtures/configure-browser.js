'use strict'

const FirefoxProfile = require('firefox-profile')
const path = require('path')
const cli = require('../../integration/fixtures/cli')
const daemon = require('../../integration/fixtures/daemon')
const commands = require('../../integration/fixtures/commands')
const nss = require('@achingbrain/nss')
const execFile = require('mz/child_process').execFile
const which = require('which-promise')
const logger = require('winston')
const fs = require('fs-promise')
const os = require('os')
const shortid = require('shortid')

const PROFILE_DIRECTORY = path.resolve(path.join(__dirname, 'profile'))

const copyDirectory = () => {
  const temporaryProfileDirectory = path.join(os.tmpdir(), shortid.generate())

  logger.debug(`Creating temporary profile directory ${temporaryProfileDirectory}`)

  return fs.copy(PROFILE_DIRECTORY, temporaryProfileDirectory)
  .then(() => temporaryProfileDirectory)
}

const configureProfile = (browser, profileDirectory) => {
  return new Promise((resolve, reject) => {
    try {
      const profile = new FirefoxProfile({
        profileDirectory: profileDirectory
      })

      profile.setPreference('security.default_personal_cert', 'Select Automatically')
      profile.setPreference('browser.fixup.alternate.enabled', false)

      profile.encoded(encodedProfile => {
        browser.options.desiredCapabilities['firefox_profile'] = encodedProfile

        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
}

const fetchCertificate = (password, cli, runner, id) => {
  return cli(`guv webkey -p ${password}`)
  .then(stdout => {
    const p12Path = stdout.split('Created ')[1]
    const p12File = p12Path.split('/').pop()
    const targetPath = path.resolve(path.join(__dirname, '..', '..', '..', 'lib', p12File))

    return commands.copyFile(
      runner,
      id,
      p12Path,
      'PROJECT_ROOT/lib'
    )
    .then(() => targetPath)
  })
}

const addCertificate = (nss, p12Path, password, profileDirectory) => {
  return which('pk12util')
  .catch(() => nss.pk12util)
  .then(pk12util => {
    logger.debug('Installing certificate')
    logger.debug(pk12util, '-i', p12Path, '-d', profileDirectory, '-W', password)

    return execFile(pk12util, ['-i', p12Path, '-d', profileDirectory, '-W', password])
  })
}

module.exports = (browser, done) => {
  Promise.all([
    cli, daemon, nss()
  ])
  .then(([cli, daemon, nss]) => {
    const password = 'foobar'

    return Promise.all([
      copyDirectory(),
      fetchCertificate(password, cli, daemon.runner, daemon.id)
    ])
    .then(([profileDirectory, p12Path]) => {
      return addCertificate(nss, p12Path, password, profileDirectory)
      .then(() => configureProfile(browser, profileDirectory))
    })
  })
  .then(done)
  .catch(error => {
    console.error(error)

    done(error)
  })
}
