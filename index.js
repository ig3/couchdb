'use strict';

var http = require('http');
var https = require('https');
var rp = require('request-promise');
var heir = require('heir');
var EventEmitter = require('events').EventEmitter;

function Server(opts) {
    if(!opts) throw new Error('Missing opts');
    if(typeof opts !== 'object') throw new TypeError('opts is not an object');
    this.hostname = opts.hostname || 'localhost';
    this.port = opts.port || 5984;
    this.username = opts.username;
    this.password = opts.password;
    this.protocol = opts.protocol || 'http';
    this.client = this.protocol === 'https' ? https : http;
}



Server.prototype.get = function(path, data) {
    var options = {
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



function Database(opts) {
    if(!opts) throw new Error('Missing opts');
    if(typeof opts !== 'object') throw new TypeError('opts is not an object');
    this.server = opts.server;
    this.db_name = opts.db_name;
    this.username = opts.username || opts.server.username;
    this.password = opts.password || opts.server.password;
}


Database.prototype.get = function(path, data) {
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


function Changes(opts) {
    if(!opts) opts = {};
    this.hostname   = opts.db.server.hostname;
    this.port       = opts.db.server.port;
    this.protocol   = opts.db.server.protocol;
    this.db_name    = opts.db.db_name;
    this.username   = opts.username || opts.db.username;
    this.password   = opts.password || opts.db.password;

    this.connect();
}

heir.inherit(Changes, EventEmitter);

Changes.prototype.cancel = function() {
    this.cancelled = 1;
    if(this.request) {
        this.request.abort();
    }
};


Changes.prototype.connect = function() {
    var client = this.protocol === 'https' ? https : http;
    var self = this;

    var auth;

    if(self.username) {
        auth = self.username + ':' + self.password;
    }

    var path = '/' + this.db_name + '/_changes?feed=continuous&heartbeat=30000';

    self.request = client.request({
        host: this.hostname,
        port: this.port,
        path: path,
        auth: auth
    }, function(res) {
        self.couchdbConnection = res;

        if((res.headers.server || '').match(/^couchdb/i)) {
            self.rawData = '';
            self.couchdbConnection.on('data', self.onData.bind(self));
            self.couchdbConnection.on('end', self.reconnect.bind(self));
        } else {
            res.destroy();
            self.emit('error', new Error('Not CouchDB'));
            self.reconnect();
        }
    })
    .on('error', function(error) {
        self.emit('error', error);
        self.reconnect();
    }).end();
};



Changes.prototype.reconnect = function() {
    if(!this.cancelled) {
        global.setTimeout(this.connect.bind(this), 10000);
    }
};


Changes.prototype.onData = function(data) {
    var self = this;

    self.rawData += data.toString();

    var changes = this.rawData.split('\n');

    self.rawData = changes.pop();

    changes.filter(function(change) { return(change != ''); })
    .forEach(function(change) {
        try {
            var data = JSON.parse(change);
            self.lastEventId = data.seq;
            self.emit('change', data);
        }
        catch(err) {
            self.emit('error', err);
        }
    });
};


Database.prototype.changes = function(opts) {
    if(!opts) opts = {};
    opts.db = this;
    return new Changes(opts);
};


Server.prototype.db = function(opts) {
    if(!opts) throw new Error('Missing opts');
    if(typeof opts !== 'object') throw new TypeError('opts is not an object');
    opts.server = this;
    return new Database(opts);
};



exports.server = function(opts) {
    return new Server(opts);
};
