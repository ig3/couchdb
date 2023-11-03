'use strict';

const http = require('http');
const https = require('https');

module.exports = function (opts) {
  console.log('rp here', opts);

  return new Promise((resolve, reject) => {
    if (!opts.uri) {
      return reject(new Error('missing uri'));
    }
    console.log('uri: ', opts.uri);
    const url = new URL(opts.uri);

    const agent = (url.protocol === 'http:') ? http : (url.protocol === 'https:') ? https : undefined;

    if (!agent) {
      return reject(new Error('unsupported protocol: ' + url.protocol));
    }

    console.log('opts: ', JSON.stringify(opts, null, 2));

    const options = {
      host: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: opts.method
    };
    if (
      opts.auth &&
      opts.auth.username &&
      opts.auth.password
    ) {
      options.auth = opts.auth.username + ':' + opts.auth.password;
    }
    console.log('options: ', JSON.stringify(options, null, 2));
    const req = agent.request(options, res => {
      const bufs = [];
      let len = 0;
      res.on('data', chunk => {
        bufs[bufs.length] = chunk;
        len += chunk.length;
      });
      res.on('end', () => {
        console.log('status: ', res.statusCode, len);
        console.log('response: ', '' + Buffer.concat(bufs, len));
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
      } else {
        req.write(opts.body, 'binary');
      }
    }
    req.end();
  });
};