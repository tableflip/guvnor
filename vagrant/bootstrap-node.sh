#!/usr/bin/env bash

# Setup nvm
git clone https://github.com/creationix/nvm.git ~/.nvm
cd ~/.nvm
git checkout `git describe --abbrev=0 --tags`

echo source ~/.nvm/nvm.sh >> ~/.profile

source ~/.profile

nvm install 0.12

echo nvm use 0.12 >> ~/.profile
