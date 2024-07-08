'use strict';

const t = require('tape');
const express = require('express');
// const net = require('net');

t.test('db.post', t => {
  t.test('_bulk_docs', t => {
    let nRequests = 0;
    let nOtherRequests = 0;
    const app = express();
    app.use(express.json());
    app.put('/testdb/xxx', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      console.log('body: ', req.body);
      t.ok(req.body, 'got a request body');
      t.equal(req.body._id, 'xxx', 'got correct _id');
      t.equal(req.body._deleted, true, 'deleted flag is set');
      t.ok(req.body.deleted_time, 'deleted_time is set'); // current time
      res.send({
        couchdb: 'Welcome',
        silly: 'nonsense',
      });
    });
    app.get('/testdb/xxx', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      console.log('body: ', req.body);
      res.send({
        couchdb: 'Welcome',
        silly: 'nonsense',
      });
    });
    app.use((req, res) => {
      nOtherRequests++;
      console.log('404: ', req.method, req.originalUrl);
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
      const db = couchdb.db({
        db_name: 'testdb',
        username: 'testuser2',
        password: 'testpass2',
      });
      db.soft_delete({
        _id: 'xxx',
      })
      .then(info => {
        t.pass('should resolve');
        t.deepEqual(
          info,
          { couchdb: 'Welcome', silly: 'nonsense' },
          'response is as expected'
        );
        t.equal(nRequests, 2, '2 request total');
        t.equal(nOtherRequests, 0, '0 unexpected requests');
        t.end();
      })
      .catch(err => {
        t.fail('should not reject');
        console.log('err: ', err);
        t.end();
      });
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
