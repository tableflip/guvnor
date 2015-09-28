
module.exports = Object.freeze({
  UNIT_FILE_LOCATIONS: process.env.GUVNOR_UNIT_FILE_LOCATIONS || '/etc/systemd/system',
  SYSTEMCTL_PATH: process.env.GUVNOR_SYSTEMCTL_PATH || '/bin/systemctl'
})
