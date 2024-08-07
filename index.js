'use strict';

const http = require('http');
const https = require('https');
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
      password: this.password,
    },
  };

  return request(options);
};

function Database (opts) {
  this.server = opts.server;
  this.db_name = opts.db_name;
  this.username = opts.username || opts.server.username;
  this.password = opts.password || opts.server.password;
}

Database.prototype.get = function (path, data) {
  return request({
    method: 'GET',
    uri: this.server.protocol + '://' +
            this.server.hostname + ':' + this.server.port +
            '/' + this.db_name + '/' + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password,
    },
  });
};

function Changes (opts) {
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
    console.log('aborting outstanding request');
    this.request.abort();
    this.request = undefined;
  }
  this.emit('cancelled');
};

Changes.prototype.connect = function () {
  if (this.cancelled) return;
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
    auth: auth,
  }, function (res) {
    self.couchdbConnection = res;

    if ((res.headers.server || '').match(/^couchdb/i)) {
      self.rawData = '';
      self.couchdbConnection.on('data', self.onData.bind(self));
      self.couchdbConnection.on('end', () => {
        if (!self.cancelled) {
          self.reconnect();
        }
      });
    } else {
      res.destroy();
      self.emit('error', new Error('Not CouchDB'));
      if (!self.cancelled) {
        self.reconnect();
      }
    }
  })
  .on('error', function (error) {
    self.emit('error', error);
    if (!self.cancelled) {
      self.reconnect();
    }
  }).end();
};

Changes.prototype.reconnect = function () {
  this.emit('reconnect');
  if (this.request) {
    this.request.abort();
    this.request = undefined;
  }
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
  return request({
    method: 'POST',
    uri: this.server.protocol + '://' +
            this.server.hostname + ':' + this.server.port +
            '/' + this.db_name + '/' + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password,
    },
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
  return request({
    method: 'PUT',
    uri: this.server.protocol + '://' +
            this.server.hostname + ':' + this.server.port +
            '/' + this.db_name + '/' + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password,
    },
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
  return request({
    method: 'POST',
    uri: this.protocol + '://' + this.hostname + ':' + this.port + path,
    body: data,
    json: true,
    auth: {
      username: this.username,
      password: this.password,
    },
  });
};

function request (opts) {
  return new Promise((resolve, reject) => {
    const url = new URL(opts.uri);

    const http = require('http');
    const https = require('https');
    const agent = (url.protocol === 'http:') ? http : https;

    const options = {
      host: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: opts.method,
    };
    if (
      opts.auth &&
      opts.auth.username &&
      opts.auth.password
    ) {
      options.auth = opts.auth.username + ':' + opts.auth.password;
    }
    const req = agent.request(options, res => {
      const bufs = [];
      let len = 0;
      res.on('data', chunk => {
        bufs[bufs.length] = chunk;
        len += chunk.length;
      });
      res.on('end', () => {
        if (
          res.statusCode === 200 ||
          res.statusCode === 201
        ) {
          return resolve(JSON.parse('' + Buffer.concat(bufs, len)));
        } else {
          const error = new Error('request failed: ' + res.statusCode);
          error.response = '' + Buffer.concat(bufs, len);
          return reject(error);
        }
      });
    });
    req.on('error', err => {
      return reject(err);
    });
    if (opts.body) {
      if (opts.json) {
        req.setHeader('content-type', 'application/json');
        req.write(JSON.stringify(opts.body));
      }
    }
    req.end();
  });
}

module.exports = function (opts) {
  return new Server(opts);
};
