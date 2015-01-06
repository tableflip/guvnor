# Statuses

## Process

These are the meanings of the possible values for the ProcessInfo object's `status` property.

 1. `uninitialised` The process has not yet started
 2. `starting` The process has been forked
 3. `started` The process has started
 4. `running` The users' module code has been loaded and is running
 5. `restarting` The processes is restarting
 6. `stopping` The process is stopping (n.b. it will not restart)
 7. `stopped` The process has stopped
 8. `errored` User code in the processes threw an error
 9. `failed` The process wrapper failed to start
 10. `aborted` The process `errored` too many times and will not be restarted
 11. `paused` The process waiting for a debugger to attach
 12. `unresponsive` The process did not respond to a status request in a timely fashion
