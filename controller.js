var os = require('os');
var dns = require('dns');

function Controller() {
  this.props = {};
  // _id
  this.set('_id', '1234');
  // app/timestamp
  this.set('app/timestamp', Date.now());
  // app/host
  dns.lookup(os.hostname(), function (err, address, family) {
    this.set('app/host', address);
  }.bind(this));
  // app/type
  this.set('app/type', 'embedded');
  // app/message/in
  this.add('app/channels', {
    topic: 'app/message/in',
    qos: 0,
    type: 'string',
    description: 'Message Reception',
    direction: 'in'
  });
  // app/message/out
  this.add('app/channels', {
    topic: 'app/message/out',
    qos: 0,
    type: 'string',
    description: 'Message Delivery',
    direction: 'out'
  });
}

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

Controller.prototype.set = function (property, value) {
  this.props[property] = value;
};

Controller.prototype.add = function (property, value) {
  if (!this.props[property]) {
    this.props[property] = [];
  }
  
  this.props[property].push(value);
};

module.exports = Controller;