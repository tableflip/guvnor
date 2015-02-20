# Changelog

Revision history for guvnor

## [3.0.2](releases/tag/v3.0.2)

 * Fix to allow web monitor to connect to 2.6.x versions of boss/guvnor and above

## [3.0.1](releases/tag/v3.0.1)

 * Fix for loading config files without rc suffixes

## [3.0.0](releases/tag/v3.0.0)

 * Renamed boss to guvnor - see [upgrading](UPGRADING.md)

## [2.6.3](releases/tag/v2.6.3)

 * No more negative event loop latency measurements
 * Handle paused processes in the web interface
 * Detect operating system (os x or various linux distros)
 * Show operating system icons in web interface

## [2.6.2](releases/tag/v2.6.2)

 * Upgrade dependencies to latest versions

## [2.6.1](releases/tag/v2.6.1)

 * Added node.js icons from [mfizz](http://fizzed.com/oss/font-mfizz)
 * Show different icons for js/coffeescript processes
 * Process events now split into cluster, worker and process
 * Use patched stylizer until [latenflip/stylizer#6](https://github.com/latentflip/stylizer/pull/6) is merged or resolved
 * Show green for daemons running node.js, yellow for io.js

## [2.6.0](releases/tag/v2.6.0)

 * Adds ability to manage coffeescript processes
 * Fixes bug where cluster worker logs were not show in web interface

## [2.5.5](releases/tag/v2.5.5)

 * Refuse to remove or switch refs under running processes
 * Switch out ansi-to-html for ansi-html for greater performance

## [2.5.4](releases/tag/v2.5.4)

 * Fix bug where typos on the command line would cause exceptions due to not matching any processes
 * Fix double callback invocation

## [2.5.3](releases/tag/v2.5.3)

 * Handle optional mdns component not being present
 * Notify in logs when components are missing instead of crashing

## [2.5.2](releases/tag/v2.5.2)

 * Make starting a process as a different user require sudo

## [2.5.1](releases/tag/v2.5.1)

 * Update dependencies
 * Fix bug where unresponsive processes would forever be reported as unresponsive
 * Switch out ampersand collections for simple arrays for process resource storage - massive performance gain for web interface
 * Reduce number of resource graph redraws for greater performance
 * Fix bug where we'd connect more than once via mdns
 * Daemon now switches cwd to run directory after startup

## [2.5.0](releases/tag/v2.5.0)

 * Adds mdns support for auto-discovery on local networks
 * CPU usage rounded to 2dp for clarity

## [2.4.8](releases/tag/v2.4.8)

 * Update dependencies
 * Adds vagrant file for easier development
 * Generated remote RPC SSL certificate length extended to a year
 * Handle errored and failed processes in web interface
 * Don't remove historic resource usage for aborted processes

## [2.4.7](releases/tag/v2.4.7)

 * Fixes crash when group id doesn't exist on Linux #22

## [2.4.6](releases/tag/v2.4.6)

 * Update formatting for process lists #24
 * Handle undefined properties of processes in list #23

## [2.4.5](releases/tag/v2.4.5)

 * Added pre-commit hook to run all tests before committing
 * Improves error messages on command line

## [2.4.4](releases/tag/v2.4.4)

 * No changes

## [2.4.3](releases/tag/v2.4.3)

 * Be silent when successfully updating app refs

## [2.4.2](releases/tag/v2.4.2)

 * Fix bug where we'd blindly assume the daemon was not running

## [2.4.1](releases/tag/v2.4.1)

 * Try to create daemon group on system if it does not exist already

## [2.4.0](releases/tag/v2.4.0)

 * Adds ability to stop/restart multiple processes at once

For older releases, see the [logs](https://github.com/tableflip/boss/commits/master)
