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

const PROFILE_DIRECTORY = path.resolve(path.join(__dirname, 'profile'))

const configureProfile = browser => {
  return new Promise((resolve, reject) => {
    try {
      const profile = new FirefoxProfile({
        profileDirectory: PROFILE_DIRECTORY
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

const addCertificate = (nss, p12Path, password) => {
  return which('pk12util')
  .catch(() => nss.pk12util)
  .then(pk12util => {
    logger.debug('Installing certificate')
    logger.debug(pk12util, '-i', p12Path, '-d', PROFILE_DIRECTORY, '-W', password)

    return execFile(pk12util, ['-i', p12Path, '-d', PROFILE_DIRECTORY, '-W', password])
  })
}

module.exports = (browser, done) => {
  Promise.all([
    cli, daemon, nss()
  ])
  .then(results => {
    const password = 'foobar'

    return fetchCertificate(password, results[0], results[1].runner, results[1].id)
    .then(p12Path => addCertificate(results[2], p12Path, password))
    .then(() => configureProfile(browser))
  })
  .then(done)
  .catch(error => {
    console.error(error)

    done(error)
  })
}
