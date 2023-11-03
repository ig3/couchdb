'use strict';

const http = require('http');
const https = require('https');
const rp = require('./rp.js');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

function Server (opts) {
  if (!opts) throw new Error('Missing opts');
  if (typeof opts !== 'object') throw new TypeError('opts is not an object');
  this.hostname = opts.hostname || 'localhost';
  this.port = opts.port || 5984;
  this.username = opts.username;
  this.password = opts.password;
  this.protocol = opts.protocol || 'http';
  this.client = this.protocol === 'https' ? https : http;
}

Server.prototype.get = function (path, data) {
  const options = {
    method: 'GET',
    uri: this.protocol + '://' + this.hostname + ':' + this.port + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password
    }
  };

  return rp(options);
};

function Database (opts) {
  if (!opts) throw new Error('Missing opts');
  if (typeof opts !== 'object') throw new TypeError('opts is not an object');
  this.server = opts.server;
  this.db_name = opts.db_name;
  this.username = opts.username || opts.server.username;
  this.password = opts.password || opts.server.password;
}

Database.prototype.get = function (path, data) {
  return rp({
    method: 'GET',
    uri: this.server.protocol + '://' +
            this.server.hostname + ':' + this.server.port +
            '/' + this.db_name + '/' + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password
    }
  });
};

function Changes (opts) {
  if (!opts) opts = {};
  this.hostname = opts.db.server.hostname;
  this.port = opts.db.server.port;
  this.protocol = opts.db.server.protocol;
  this.db_name = opts.db.db_name;
  this.username = opts.username || opts.db.username;
  this.password = opts.password || opts.db.password;

  this.connect();
}

util.inherits(Changes, EventEmitter);

Changes.prototype.cancel = function () {
  this.cancelled = 1;
  if (this.request) {
    this.request.abort();
  }
  this.emit('cancelled');
};

Changes.prototype.connect = function () {
  const client = this.protocol === 'https' ? https : http;
  const self = this;

  let auth;

  if (self.username) {
    auth = self.username + ':' + self.password;
  }

  const path = '/' + this.db_name + '/_changes?feed=continuous&heartbeat=30000';

  self.request = client.request({
    host: this.hostname,
    port: this.port,
    path: path,
    auth: auth
  }, function (res) {
    self.couchdbConnection = res;

    if ((res.headers.server || '').match(/^couchdb/i)) {
      self.rawData = '';
      self.couchdbConnection.on('data', self.onData.bind(self));
      self.couchdbConnection.on('end', self.reconnect.bind(self));
    } else {
      res.destroy();
      self.emit('error', new Error('Not CouchDB'));
      self.reconnect();
    }
  })
  .on('error', function (error) {
    self.emit('error', error);
    self.reconnect();
  }).end();
};

Changes.prototype.reconnect = function () {
  this.emit('reconnect');
  if (!this.cancelled) {
    global.setTimeout(this.connect.bind(this), 10000);
  }
};

Changes.prototype.onData = function (data) {
  const self = this;

  self.rawData += data.toString();

  const changes = this.rawData.split('\n');

  // A continuous changes feed sends lines of JSON text
  // A chunk will typically end with a newline but it is possible that a
  // line is split across chunks so that one chun ends with the first part
  // of a line and the next chun begins with the rest of the line.
  // We need whole lines.
  // Save anything after the last newline to rawData, to be concatenated
  // with the next chunk. This will typically be an empty string but
  // occasionally it will not be empty.
  self.rawData = changes.pop();

  changes.filter(function (change) { return (change !== ''); })
  .forEach(function (change) {
    try {
      const data = JSON.parse(change);
      self.lastEventId = data.seq;
      self.emit('change', data);
    } catch (err) {
      self.emit('error', err);
    }
  });
};

Database.prototype.changes = function (opts) {
  if (!opts) opts = {};
  opts.db = this;
  return new Changes(opts);
};

Database.prototype.post = function (path, data) {
  return rp({
    method: 'POST',
    uri: this.server.protocol + '://' +
            this.server.hostname + ':' + this.server.port +
            '/' + this.db_name + '/' + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password
    }
  });
};

Database.prototype.purge = function (id) {
  const self = this;
  return this.get(id + '?meta=true')
  .then(function (doc) {
    const revs = doc._revs_info
    .filter(function (info) { return (info.status === 'available'); })
    .map(function (info) { return (info.rev); });
    const data = {};
    data[id] = revs;
    return self.post('_purge', data);
  });
};

Database.prototype.put = function (path, data) {
  return rp({
    method: 'PUT',
    uri: this.server.protocol + '://' +
            this.server.hostname + ':' + this.server.port +
            '/' + this.db_name + '/' + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password
    }
  });
};

Database.prototype.soft_delete = function (doc) {
  const self = this;

  doc.deleted_time = new Date().toISOString();
  doc._deleted = true;

  return this.put(doc._id, doc)
  .then(function (info) {
    return self.get(doc._id + '?rev=' + info.rev);
  });
};

Server.prototype.db = function (opts) {
  if (!opts) throw new Error('Missing opts');
  if (typeof opts !== 'object') throw new TypeError('opts is not an object');
  opts.server = this;
  return new Database(opts);
};

Server.prototype.post = function (path, data) {
  return rp({
    method: 'POST',
    uri: this.protocol + '://' + this.hostname + ':' + this.port + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password
    }
  });
};

exports.server = function (opts) {
  return new Server(opts);
};
