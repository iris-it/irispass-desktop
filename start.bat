start /b "grunt override" grunt watch

cd osjs/

start /b "grunt osjs" grunt watch

cd bin

start /b "server osjs" win-start-dev.cmd

cd ../../
