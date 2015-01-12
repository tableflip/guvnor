#!/usr/bin/env bash

# Setup Node apt-get sources
curl -sL https://deb.nodesource.com/setup | bash -

# Update system and install node
apt-get update -y
apt-get install -y nodejs build-essential git

# Not required, but useful
npm install -g node-inspector

# Start boss in debug mode
mkdir /etc/boss
echo [debug] > /etc/boss/bossrc
echo daemon = 5858 >> /etc/boss/bossrc
