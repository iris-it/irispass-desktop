#!/usr/bin/env bash

rm -rf osjs

git clone https://github.com/os-js/OS.js.git osjs

# install the dependencies of the project
npm install

# make the override from the project to os.js
grunt build

# no comment
cd osjs

# install the dependencies of os.js
npm install
npm install node-mysql bcryptjs node-rest-client
git clone https://github.com/gildas-lormeau/zip.js.git vendor/zip.js

# build os.js
grunt
