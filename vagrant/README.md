# Creating base boxes

```sh
$ vagrant init debian/jessie64
$ vagrant up
$ vagrant ssh
```

.. inside the virtual:

```sh
$ sudo su -
# apt-get update
# apt-get upgrade -y
# apt-get install -y curl build-essential git libavahi-compat-libdnssd-dev
# curl --silent --location https://deb.nodesource.com/setup_4.x | sudo bash -
# apt-get install -y nodejs
# mkdir /opt/guvnor
```

.. copy package.json to /opt/guvnor and bin/guv to /opt/guvnor/bin/guv

```
# cd /opt/guvnor
# npm install
# npm link
# apt-get clean
# dd if=/dev/zero of=/EMPTY bs=1M
# rm -f /EMPTY
# cat /dev/null > ~/.bash_history && history -c && exit
```

.. back in the non-virtual:

```
$ vagrant package --output guvnor.box
$ vagrant box add --force guvnor-node-4.x guvnor.box
$ vagrant destroy
$ rm Vagrantfile
```
