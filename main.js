var http = require('http');
var express = require('express');
var RED = require('node-red');
var mosca = require('mosca');
var util = require('util');
var path = require('path');
var os = require('os');
var bleno = require('bleno');
var Controller = require('./controller');

/**
 * Controller Configuration
 */
var controller = new Controller();

/**
 * Bleno Configuration
 */

// Once bleno starts, begin advertising our BLE address
bleno.on('stateChange', function (state) {
    console.log('[Bleno] State change: ' + state);
    if (state === 'poweredOn') {
        bleno.startAdvertising('Intel XDK IoT', ['12ab']);
    } else {
        bleno.stopAdvertising();
    }
});

// Notify the console that we've accepted a connection
bleno.on('accept', function (clientAddress) {
    console.log('[Bleno] Accepted connection from address: ' + clientAddress);
});

// Notify the console that we have disconnected from a client
bleno.on('disconnect', function (clientAddress) {
    console.log('[Bleno] Disconnected from address: ' + clientAddress);
});

// When we begin advertising, create a new service and characteristic
bleno.on('advertisingStart', function (error) {
    if (error) {
        console.log('[Bleno] Advertising start error:' + error);
    } else {
        console.log('[Bleno] Advertising start success');
        bleno.setServices([
            // Define a new service
            new bleno.PrimaryService({
                uuid: '12ab',
                characteristics: [
                    // Define a new characteristic within that service
                    new bleno.Characteristic({
                        value: null,
                        uuid: '34cd',
                        properties: ['notify', 'read', 'write'],

                        // If the client subscribes, we send out a message every 1 second
                        onSubscribe: function (maxValueSize, updateValueCallback) {
                            console.log('[Bleno] Device subscribed');
                            // TODO: add logic for client subscribed.
                            // send to client with updateValueCallback function
                            // e.g: updateValueCallback( new Buffer('Hi!'))
                        },

                        // If the client unsubscribes, we stop broadcasting the message
                        onUnsubscribe: function () {
                            console.log('[Bleno] Device unsubscribed');
                            // TODO: add code for client unsubscribed.
                        },

                        // Send a message back to the client with the characteristic's value
                        onReadRequest: function (offset, callback) {
                            console.log('[Bleno] Read request received');
                            // TODO: add logic for read request
                            // send to client with callback function
                            // e.g: callback(this.RESULT_SUCCESS, new Buffer('Value')
                        },

                        // Accept a new value for the characterstic's value
                        onWriteRequest: function (data, offset, withoutResponse, callback) {
                            console.log('[Bleno] Write request: ' + data ? data.toString('utf-8') : '');
                            // TODO: add logic for wirte request
                            // call callback function with status
                            // e.g: callback(this.RESULT_SUCCESS);
                        }
                    })
                ]
            })
        ]);
    }
});

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
    httpAdminRoot: '/admin',
    httpNodeRoot: '/api',
    userDir: path.resolve(__dirname, '.node-red'),
    flowFile: 'flows.json',
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