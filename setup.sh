#!/usr/bin/env bash

# We get the latest updates from os.js
git submodule foreach git pull origin master

# install the dependencies of the project
npm install

# make the override from the project to os.js
grunt build

# no comment
cd osjs

# install the dependencies of os.js
npm install
npm install node-mysql bcryptjs

# build os.js
grunt