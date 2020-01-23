//
//    ,--.                      ,--.          ,--.
//  ,-|  ,--.--.,--,--,--.   ,--|  |-. ,---.,-'  '-.
// ' .-. |  .--' ,-.  |  |.'.|  | .-. | .-. '-.  .-'
// \ `-' |  |  \ '-'  |   .'.   | `-' ' '-' ' |  |
//  `---'`--'   `--`--'--'   '--'`---' `---'  `--'
// Created by Andy Wise, modified by Chris Tarantl
//

// import external and node-specific modules
var Config = require('./modules/Config')
var BotController = require('./modules/BotController')
var LocalServer = require('./modules/LocalServer')

var isPi = require('detect-rpi');

if (isPi()) {
	console.log('Running on Raspberry Pi!');
} else {
	console.log('NOT Running on Raspberry Pi!');
}

// SETUP
var botController, localServer
var config = Config('config.json', () => {

	// Main Controller
	botController = BotController(config)

	// Local Server
	localServer = LocalServer(config, botController)
	botController.localio = localServer.io

	// Initialize!
	go()
})

//  START
var go = () => {
	botController.updateStringLengths()
	botController.setStates()
	localServer.start()
}

// GRACEFUL EXIT
// per http://joseoncode.com/2014/07/21/graceful-shutdown-in-node-dot-js/
// and https://github.com/fivdi/pigpio/issues/6
var shutdown = () => {
	console.log('stopping the drawbot app...')
    localServer.server.close()
	process.exit(0)
}
process.on('SIGHUP', shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGCONT', shutdown)