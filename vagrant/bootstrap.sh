#!/usr/bin/env bash

# Update system and install node
apt-get install -y build-essential git

# Install some nodes and some io.jss for root and vagrant
chmod +x /vagrant/bootstrap-node.sh
/vagrant/bootstrap-node.sh
sudo -u vagrant -i /vagrant/bootstrap-node.sh
