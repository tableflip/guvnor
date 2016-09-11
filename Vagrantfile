# -*- mode: ruby -*-
# vi: set ft=ruby :

# This vagrant file is for the integration test suite

$user = "vagrant"
$group = "vagrant"
$path = "/home/vagrant"

Vagrant.configure("2") do |config|
  config.vm.box = "williamyeh/debian-jessie64-docker"

  config.vm.provider :virtualbox do |vb|
    vb.memory = 2048
    vb.cpus = 2
    vb.check_guest_additions = true
    vb.functional_vboxsf = true
  end

  config.vm.network :forwarded_port, guest: 8000, host: 8000
  config.vm.network :forwarded_port, guest: 8001, host: 8001
  config.vm.network :forwarded_port, guest: 8002, host: 8002
  config.vm.network :forwarded_port, guest: 8003, host: 8003

  config.vm.synced_folder "lib", "%s/lib" % $path,
    :owner => $user,
    :group => $group,
    :mount_options => ["dmode=775","fmode=664"]
  config.vm.synced_folder "test", "%s/test" % $path,
    :owner => $user,
    :group => $group,
    :mount_options => ["dmode=775","fmode=664"]
  config.vm.synced_folder "bin", "%s/bin" % $path,
    :owner => $user,
    :group => $group,
    :mount_options => ["dmode=775","fmode=664"]

  config.vm.provision "file", source: "package.json", destination: "%s/package.json" % $path
  config.vm.provision "file", source: "index.js", destination: "%s/index.js" % $path
  config.vm.provision "file", source: "Dockerfile-guvnor-tests", destination: "%s/Dockerfile-guvnor-tests" % $path
  config.vm.provision "file", source: "guvnor.service", destination: "%s/guvnor.service" % $path
end
