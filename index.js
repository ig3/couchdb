'use strict';

var http = require('http');
var https = require('https');
var rp = require('request-promise');

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


Server.prototype.db = function(opts) {
    if(!opts) throw new Error('Missing opts');
    if(typeof opts !== 'object') throw new TypeError('opts is not an object');
    opts.server = this;
    return new Database(opts);
};



exports.server = function(opts) {
    return new Server(opts);
};
