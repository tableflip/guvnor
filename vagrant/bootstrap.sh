#!/usr/bin/env bash

# Setup Node apt-get sources
curl -sL https://deb.nodesource.com/setup | bash -

# Update system and install node
apt-get update -y
apt-get install -y nodejs build-essential git

# Not required, but useful
npm install -g node-inspector

# Start guvnor in debug mode
mkdir /etc/guvnor
echo [debug] > /etc/guvnor/guvnorrc
echo daemon = 5858 >> /etc/guvnor/guvnorrc
