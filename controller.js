var os = require('os');
var dns = require('dns');

/**
 * Controller Class
 * @constructor
 */
function Controller() {
    this.props = {};
    // _id
    this.set('_id', '1234');
    // app/timestamp
    this.set('app/timestamp', Date.now());
    // app/host
    var networkInterfaces = os.networkInterfaces();
    // harcoded wlan0 interface
    this.set('app/host', networkInterfaces['wlan0'][0].address);
    /**
     * Can also use dns.lookup like this:
     *
     * dns.lookup(os.hostname(), function (err, address, family) {
     *   this.set('app/host', address);
     * }.bind(this));
     */
    // app/type
    this.set('app/type', 'embedded');
}

/**
 * Get a Controller property
 * @param {string|function} [property]
 * @param {function} callback
 */
Controller.prototype.get = function (property, callback) {
    if (typeof property === 'function') {
        callback = property;
        callback(null, this.props);
        return;
    }

    switch (property) {
    case 'app/host':
        dns.lookup(os.hostname(), callback);
        break;
    default:
        callback(null, this.props[property]);
    }
};

/**
 * Set a Controller property
 * @param {string} property
 * qparam {object} value
 */
Controller.prototype.set = function (property, value) {
    this.props[property] = value;
};

/**
 * Add a value to a Controller property
 * @param {string} property
 * qparam {object} value
 */
Controller.prototype.add = function (property, value) {
    if (!this.props[property]) {
        this.props[property] = [];
    }

    this.props[property].push(value);
};

module.exports = Controller;