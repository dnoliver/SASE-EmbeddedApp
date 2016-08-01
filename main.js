var http = require('http');
var express = require("express");
var RED = require("node-red");
var mosca = require("mosca");
var util = require('util');
var Controller = require('./controller');

/**
 * Controller Configuration
 */
var controller = new Controller();

/**
 * Express Server Creation
 */

// Create an Express app
var app = express();

// Create a server
var server = http.createServer(app);

/**
 * Mosca Broker Creation
 */

var MoscaServerSettings = {
  port: 1883,
  http: {
    port: 8001
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
  userDir: "./.nodered",
  flowFile: "flows.json",
  functionGlobalContext: {
    Controller: controller
  }
};

// Initialise the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

server.listen(8000);

// Start the runtime
RED.start();

controller.set('app/name', 'SASE-EmbeddedApp');
controller.set('app/port', 8000);
controller.set('app/api', settings.httpNodeRoot);
controller.set('app/broker/port', MoscaServerSettings.port);
controller.set('app/broker/http/port', MoscaServerSettings.http.port);