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


Server.prototype.db = function(opts) {
};



exports.server = function(opts) {
    return new Server(opts);
};
