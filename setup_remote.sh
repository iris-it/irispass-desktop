#!/usr/bin/env bash

# clean install
rm -rf osjs
git clone https://github.com/os-js/OS.js.git osjs

# install the dependencies of the project
npm install

# no comment
cd osjs

# install the dependencies of os.js
npm install --production
npm install node-rest-client
git clone https://github.com/gildas-lormeau/zip.js.git vendor/zip.js

# build os.js
node osjs build

# back to override project
cd ..

# make the override from the project to os.js
grunt build
