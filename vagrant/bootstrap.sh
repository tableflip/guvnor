#!/usr/bin/env bash

# Update system and install node
apt-get update -y
apt-get install -y build-essential git

# Install some nodes and some io.jss for root and vagrant
chmod +x /vagrant/bootstrap-node.sh
/vagrant/bootstrap-node.sh
sudo -u vagrant -i /vagrant/bootstrap-node.sh

# Start guvnor in debug mode
mkdir /etc/guvnor
echo [debug] > /etc/guvnor/guvnor
echo daemon = 5858 >> /etc/guvnor/guvnor
