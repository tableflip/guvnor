#!/usr/bin/env bash

# Setup nvm
git clone https://github.com/creationix/nvm.git ~/.nvm
cd ~/.nvm
git checkout `git describe --abbrev=0 --tags`

echo source ~/.nvm/nvm.sh >> ~/.profile

source ~/.profile

# Install some nodes and some io.jss
nvm install 0.10
nvm install 0.12
nvm install iojs-v1.1.0
nvm install iojs-v1.2.0
nvm use 0.12

# Not required, but useful
npm install -g node-inspector

echo nvm use 0.12 >> ~/.profile
