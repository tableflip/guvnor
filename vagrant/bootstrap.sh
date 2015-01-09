#!/usr/bin/env bash

curl -sL https://deb.nodesource.com/setup | bash -

apt-get install -y nodejs build-essential git

npm install -g process-boss

# Not required, but useful
npm install -g node-inspector
