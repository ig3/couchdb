'use strict';

var http = require('http');
var https = require('https');
var rp = require('request-promise');

module.exports = Server;


function Server(opts) {
    this.hostname = opts.hostname || localhost;
    this.port = opts.port || 5984;
    this.auth = opts.auth;
    this.protocol = opts.protocol || 'http';
    this.client = this.protocol === 'https' ? https : http;
}



Server.prototype.get = function(path, data) {
    var options = {
        method: GET,
        uri: this.protocol + '://' + this.hostname + ':' + this.port + path,
        body: data,
        json: true
    };

    return rp(options);
};
