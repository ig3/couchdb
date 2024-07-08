'use strict';

const t = require('tape');
const express = require('express');
// const net = require('net');

t.test('post', t => {
  t.test('/test/_bulk_docs', t => {
    let nRequests = 0;
    let nOtherRequests = 0;
    const app = express();
    app.use(express.json());
    app.post('/test/_bulk_docs', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser', 'username is testuser');
      t.equal(password, 'testpass', 'password is testpass');
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
      res.status(404).send('Not found');
    });

    const server = app.listen(0, '127.0.0.1');
    t.teardown(() => {
      server.close();
    });

    server.on('listening', async () => {
      const host = server.address().address;
      const port = server.address().port;
      const couchdb = require('..')({
        hostname: host,
        port: port,
        username: 'testuser',
        password: 'testpass',
      });
      await couchdb.post('/test/_bulk_docs', {
        docs: [{
          _id: 'test_doc1',
          data: 'This is a test',
        }],
      })
      .then(info => {
        t.deepEqual(
          info,
          { couchdb: 'Welcome', silly: 'nonsense' },
          'response is as expected'
        );
        t.equal(nRequests, 1, '1 request total');
        t.equal(nOtherRequests, 0, '0 unexpected requests');
        t.end();
      })
      .catch(err => {
        t.end(err);
      });
    });
  });
  console.log('test is done');
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
