'use strict';

const t = require('tape');
const express = require('express');
const net = require('net');

t.test('get', t => {
  t.test('get /', t => {
    let nRequests = 0;
    let nOtherRequests = 0;
    const app = express();
    app.get('/', (req, res) => {
      nRequests++;
      res.send({
        couchdb: 'Welcome',
        silly: 'nonsense',
      });
    });
    app.use((req, res) => {
      nOtherRequests++;
      res.status(404).send('Not found');
    });

    const server = app.listen(0, '127.0.0.1');
    t.teardown(() => {
      server.close();
    });

    server.on('listening', () => {
      const host = server.address().address;
      const port = server.address().port;
      console.log('listening on https://%s:%s', host, port);
      const couchdb = require('..')({
        hostname: host,
        port: port,
      });
      const x = couchdb.get('/');
      t.equal(typeof x.then, 'function', 'returns a promise');
      t.equal(typeof x.catch, 'function', 'returns a promise');
      x.then(result => {
        console.log('resolved 1');
        t.equal(typeof result, 'object', 'resolves to an object');
        t.equal(result.couchdb, 'Welcome', 'returns welcome message');
        t.equal(nRequests, 1, '1 request handled');
        t.equal(nOtherRequests, 0, '0 other requests handled');
      })
      .finally(() => {
        t.end();
      });
    });
  });

  t.test('rejects on error response', t => {
    const app = express();
    app.use((req, res) => {
      res.status(404).send('Not found');
    });

    const server = app.listen(0, '127.0.0.1');
    t.teardown(() => {
      server.close();
    });

    server.on('listening', async () => {
      const host = server.address().address;
      const port = server.address().port;
      console.log('listening on https://%s:%s', host, port);
      const couchdb = require('..')({
        hostname: host,
        port: port,
      });
      couchdb.get('/bad-path')
      .then(result => {
        console.log('bad path resolved');
        t.fail('should not resolve');
      })
      .catch(err => {
        console.log('rejected 2');
        t.equal(err.message, 'request failed: 404', '404 error');
        t.equal(err.response, 'Not found', 'Not found message');
      })
      .finally(() => {
        t.end();
      });
    });
  });

  t.test('rejects on connection refused', async t => {
    const host = '127.0.0.1';
    const port = await freePort();
    console.log('listening on https://%s:%s', host, port);
    const couchdb = require('..')({
      hostname: host,
      port: port,
    });
    await couchdb.get('/')
    .then(result => {
      t.fail('should not resolve');
      t.end();
    })
    .catch(err => {
      console.log('rejected 3');
      t.equal(err.code, 'ECONNREFUSED', 'ECONNREFUSED error');
      t.end();
    });
  });
});

async function freePort () {
  return new Promise(res => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => res(port));
    });
  });
}
