var http = require('http');
var express = require("express");
var RED = require("node-red");
var mosca = require("mosca");
var util = require('util');
var path = require('path');
var os = require('os');
var Controller = require('./controller');

/**
 * Controller Configuration
 */
var controller = new Controller();

/**
 * Express Server Creation
 */

var ExpressAppSettings = {
    port: 8000
};

// Create an Express app
var app = express();

// Create a server
var server = http.createServer(app);

/**
 * Mosca Broker Creation
 */

var MoscaServerSettings = {
    port: 1884, // tsl port, provide Mqtt Standard support
    http: {
        port: 8001 // http port, provide Mqtt over Websockets support
    }
};

var MoscaServer = new mosca.Server(MoscaServerSettings);

// fired when the mqtt server is ready
MoscaServer.on('ready', function () {
    console.log('[MoscaServer] up and running in port', MoscaServerSettings.port);
    console.log('[MoscaServer] http port is', MoscaServerSettings.http.port);
});

// fired when a message is published
MoscaServer.on('published', function (packet) {
    console.log('[MoscaServer]', 'Published', packet.topic);
});
// fired when a client connects
MoscaServer.on('clientConnected', function (client) {
    console.log('[MoscaServer]', 'Client Connected:', client.id);
});

// fired when a client disconnects
MoscaServer.on('clientDisconnected', function (client) {
    console.log('[MoscaServer]', 'Client Disconnected:', client.id);
});

/**
 * Node-RED Server Creation
 */

// Node-RED Settings
var settings = {
    httpAdminRoot: "/admin",
    httpNodeRoot: "/api",
    userDir: "./.node-red",
    flowFile: "flows.json",
    functionGlobalContext: {
        Controller: controller,
        require: require
    }
};

// Initialize the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

server.listen(ExpressAppSettings.port);

// Start the runtime
RED.start();

controller.set('app/name', os.hostname());
controller.set('app/port', ExpressAppSettings.port);
controller.set('app/api', settings.httpNodeRoot);
controller.set('app/broker/port', MoscaServerSettings.port);
controller.set('app/broker/http/port', MoscaServerSettings.http.port);