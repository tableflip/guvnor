'use strict'

const FirefoxProfile = require('firefox-profile')
const path = require('path')
const cli = require('../../integration/fixtures/cli')
const daemon = require('../../integration/fixtures/daemon')
const commands = require('../../integration/fixtures/commands')

const configureProfile = (browser, certificate) => {
  return new Promise((resolve, reject) => {
    try {
      const profileDirectory = path.resolve(path.join(__dirname, 'profile', 'anonymous621296964789239276webdriver-profile'))

      const profile = new FirefoxProfile({
        profileDirectory: profileDirectory
      })
      profile.setPreference('geo.prompt.testing', true)
      profile.setPreference('geo.prompt.testing.allow', true)

      profile.setPreference('security.default_personal_cert', 'Select Automatically')

      profile.encoded((encodedProfile) => {
        browser.options.desiredCapabilities['firefox_profile'] = encodedProfile

        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
}

const fetchCertificate = (cli, runner, id) => {
  const password = 'foobar'

  return cli(`guv webkey -p ${password}`)
  .then(stdout => {
    const p12Path = stdout.split('Created ')[1]
    const p12File = p12Path.split('/').pop()
    const targetPath = path.resolve(path.join(__dirname, '..', '..', 'lib', p12File))

    return commands.copyFile(
      runner,
      id,
      p12Path,
      'PROJECT_ROOT/lib'
    )
    //.then(() => pem.readPkcs12(targetPath, {
    //    p12Password: password
    //}))
  })
  //.then(certs => loadApi(certs))
  //.then(api => api.process.list())
  //.then(processes => t.truthy(Array.isArray(processes)))
}

module.exports = (browser, done) => {
  Promise.all([
    cli, daemon
  ])
  .then(results => {
    return fetchCertificate(results[0], results[1].runner, results[1].id)
    .then(certifcate => configureProfile(browser, certifcate))
  })
  .then(done)
  .catch(error => {
    console.error(error)

    done(error)
  })
}
