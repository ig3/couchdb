'use strict';

const t = require('tape');
const express = require('express');
// const net = require('net');

t.test('db', t => {
  t.test('no options', t => {
    let nRequests = 0;
    let nOtherRequests = 0;
    const app = express();
    app.use(express.json());
    app.post('/testdb/_bulk_docs', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      t.ok(req.body, 'got a request body');
      t.deepEqual(
        req.body,
        { docs: [{ _id: 'test_doc1', data: 'This is a test' }] },
        'body is as expected'
      );
      res.send({
        couchdb: 'Welcome',
        silly: 'nonsense',
      });
    });
    app.use((req, res) => {
      nOtherRequests++;
      console.log('url: ', req.originalUrl);
      res.status(404).send('Not found');
    });

    const server = app.listen(0, '127.0.0.1');
    t.teardown(() => {
      server.close();
    });

    server.on('listening', () => {
      const host = server.address().address;
      const port = server.address().port;
      const couchdb = require('..')({
        hostname: host,
        port: port,
        username: 'testuser',
        password: 'testpass',
      });
      try {
        couchdb.db();
        t.fail('should not succeed');
        t.end();
      } catch (err) {
        t.pass('should throw');
        t.equal(err.message, 'Missing opts', 'error message');
        t.equal(nRequests, 0, '0 requests');
        t.equal(nOtherRequests, 0, '0 other requests');
        t.end();
      }
    });
  });

  t.test('options is not an object', t => {
    let nRequests = 0;
    let nOtherRequests = 0;
    const app = express();
    app.use(express.json());
    app.post('/testdb/_bulk_docs', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      t.ok(req.body, 'got a request body');
      t.deepEqual(
        req.body,
        { docs: [{ _id: 'test_doc1', data: 'This is a test' }] },
        'body is as expected'
      );
      res.send({
        couchdb: 'Welcome',
        silly: 'nonsense',
      });
    });
    app.use((req, res) => {
      nOtherRequests++;
      console.log('url: ', req.originalUrl);
      res.status(404).send('Not found');
    });

    const server = app.listen(0, '127.0.0.1');
    t.teardown(() => {
      server.close();
    });

    server.on('listening', () => {
      const host = server.address().address;
      const port = server.address().port;
      const couchdb = require('..')({
        hostname: host,
        port: port,
        username: 'testuser',
        password: 'testpass',
      });
      try {
        couchdb.db('non-object options');
        t.fail('should not succeed');
        t.end();
      } catch (err) {
        t.pass('should throw');
        t.equal(err.message, 'opts is not an object', 'error message');
        t.equal(nRequests, 0, '0 requests');
        t.equal(nOtherRequests, 0, '0 other requests');
        t.end();
      }
    });
  });
});

/*
async function freePort() {
  return new Promise( res => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => res(port));
    });
  });
}
*/
