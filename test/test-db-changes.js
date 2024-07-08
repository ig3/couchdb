'use strict';

const t = require('tape');
const express = require('express');
const net = require('net');

t.test('db.changes', t => {
  t.test('basic continuous feed', t => {
    let nRequests = 0;
    let n404Requests = 0;
    const app = express();
    app.use(express.json());
    app.get('/testdb/_changes', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser2');
      t.equal(password, 'testpass2', 'password is testpass2');
      res.append('Server', 'CouchDB/3.2.0');
      res.write('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      res.write('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      res.write(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      res.write('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      res.write(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      setTimeout(() => {
        res.write('\r\r\r');
        res.write(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      }, 2000);
    });
    app.use((req, res) => {
      n404Requests++;
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
      const changes = db.changes();
      let nChanges = 0;
      changes.on('change', change => {
        nChanges++;
      });
      changes.on('error', err => {
        console.log('change error: ', err);
        t.fail('should not emit error');
      });

      setTimeout(() => {
        changes.cancel();
      }, 5000);

      changes.on('cancelled', () => {
        t.pass('got cancelled event');
        t.equal(nChanges, 10, '10 changes');
        t.equal(nRequests, 1, '1 request');
        t.equal(n404Requests, 0, '0 404 requests');
        t.end();
      });
    });
  });

  t.test('with options', t => {
    let nRequests = 0;
    let n404Requests = 0;
    const app = express();
    app.use(express.json());
    app.get('/testdb/_changes', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser3', 'username is testuser3');
      t.equal(password, 'testpass3', 'password is testpass3');
      res.append('Server', 'CouchDB/3.2.0');
      res.write('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      res.write('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      res.write(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      res.write('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      res.write(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      setTimeout(() => {
        res.write('\r\r\r');
        res.write(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      }, 2000);
    });
    app.use((req, res) => {
      n404Requests++;
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
      const changes = db.changes({
        username: 'testuser3',
        password: 'testpass3',
      });
      let nChanges = 0;
      changes.on('change', change => {
        nChanges++;
      });
      changes.on('error', err => {
        console.log('change error: ', err);
        t.fail('should not emit error');
      });

      setTimeout(() => {
        changes.cancel();
      }, 5000);

      changes.on('cancelled', () => {
        t.pass('got cancelled event');
        t.equal(nChanges, 10, '10 changes');
        t.equal(nRequests, 1, '1 request');
        t.equal(n404Requests, 0, '0 404 requests');
        t.end();
      });
    });
  });

  t.test('server response missing Server header', t => {
    let nRequests = 0;
    let n404Requests = 0;
    const app = express();
    app.use(express.json());
    app.get('/testdb/_changes', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      res.write('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      res.write('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      res.write(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      res.write('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      res.write(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      setTimeout(() => {
        res.write('\r\r\r');
        res.write(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      }, 2000);
    });
    app.use((req, res) => {
      n404Requests++;
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
      const changes = db.changes();
      let nChanges = 0;
      changes.on('change', change => {
        t.fail('should not emit change events');
        nChanges++;
      });
      changes.on('error', err => {
        t.pass('should emit error');
        t.equal(err.message, 'Not CouchDB', 'Error message is Not CouchDB');
        changes.cancel();
      });

      changes.on('cancelled', () => {
        t.pass('got cancelled event');
        t.equal(nChanges, 0, '0 changes');
        t.equal(nRequests, 1, '1 request');
        t.equal(n404Requests, 0, '0 404 requests');
        t.end();
      });
    });
  });

  t.test('server response missing Server header', t => {
    let nRequests = 0;
    let n404Requests = 0;
    const app = express();
    app.use(express.json());
    app.get('/testdb/_changes', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      res.write('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      res.write('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      res.write(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      res.write('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      res.write(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      setTimeout(() => {
        res.write('\r\r\r');
        res.write(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      }, 2000);
    });
    app.use((req, res) => {
      n404Requests++;
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
      const changes = db.changes();
      let nChanges = 0;
      changes.on('change', change => {
        t.fail('should not emit change events');
        nChanges++;
      });
      changes.on('error', err => {
        t.pass('should emit error');
        t.equal(err.message, 'Not CouchDB', 'Error message is Not CouchDB');
        setTimeout(
          () => {
            changes.cancel();
          },
          100
        );
      });

      changes.on('cancelled', () => {
        t.pass('got cancelled event');
        t.equal(nChanges, 0, '0 changes');
        t.equal(nRequests, 1, '1 request');
        t.equal(n404Requests, 0, '0 404 requests');
        t.end();
      });
    });
  });

  t.test('changes.reconnect', t => {
    let nRequests = 0;
    let n404Requests = 0;
    const app = express();
    app.use(express.json());
    app.get('/testdb/_changes', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      res.append('Server', 'CouchDB/3.2.0');
      res.write('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      res.write('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      res.write(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      res.write('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      res.write(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      setTimeout(() => {
        res.write('\r\r\r');
        res.write(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      }, 2000);
    });
    app.use((req, res) => {
      n404Requests++;
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
      const changes = db.changes();
      let nChanges = 0;
      let nReconnects = 0;
      changes.on('change', change => {
        nChanges++;
      });
      changes.on('error', err => {
        console.log('change error: ', err);
        t.fail('should not emit error');
      });

      changes.on('reconnect', () => {
        nReconnects++;
      });

      changes.on('cancelled', () => {
        t.equal(nChanges, 20, '20 changes');
        t.equal(nReconnects, 1, '1 reconnect');
        t.equal(nRequests, 2, '2 requests');
        t.equal(n404Requests, 0, '0 404 requests');
        t.end();
      });

      setTimeout(() => {
        changes.reconnect();
      }, 5000);

      setTimeout(() => {
        changes.cancel();
      }, 20000);
    });
  });

  t.test('changes - with corrupt change', t => {
    let nRequests = 0;
    let n404Requests = 0;
    const app = express();
    app.use(express.json());
    app.get('/testdb/_changes', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      res.append('Server', 'CouchDB/3.2.0');
      res.write('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}],bad json}\n');
      res.write('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      res.write(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      res.write('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      res.write(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      setTimeout(() => {
        res.write('\r\r\r');
        res.write(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      }, 2000);
    });
    app.use((req, res) => {
      n404Requests++;
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
      const changes = db.changes();
      let nChanges = 0;
      let nReconnects = 0;
      let nErrors = 0;
      changes.on('change', change => {
        nChanges++;
      });
      changes.on('error', err => {
        t.pass('should emit error');
        t.equal(err.name, 'SyntaxError', 'SyntaxError');
        nErrors++;
      });

      changes.on('reconnect', () => {
        nReconnects++;
        t.fail('should not reconnect');
      });

      changes.on('cancelled', () => {
        t.equal(nChanges, 9, '9 changes');
        t.equal(nReconnects, 0, '0 reconnects');
        t.equal(nRequests, 1, '1 request');
        t.equal(n404Requests, 0, '0 404 requests');
        t.equal(nErrors, 1, '1 error');
        t.end();
      });

      setTimeout(() => {
        changes.cancel();
      }, 5000);
    });
  });

  t.test('changes - with connection refused', t => {
    (async () => {
      const host = '127.0.0.1';
      const port = await freePort();
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
      const changes = db.changes();
      let nChanges = 0;
      let nReconnects = 0;
      let nErrors = 0;
      changes.on('change', change => {
        nChanges++;
      });
      changes.on('error', err => {
        t.pass('should emit error');
        t.equal(err.name, 'Error', 'Error');
        t.equal(err.code, 'ECONNREFUSED', 'ECONNREFUSED');
        nErrors++;
        changes.cancel();
      });

      changes.on('reconnect', () => {
        nReconnects++;
        t.fail('should not reconnect');
      });

      changes.on('cancelled', () => {
        t.equal(nChanges, 0, '0 changes');
        t.equal(nReconnects, 0, '0 reconnects');
        t.equal(nErrors, 1, '1 error');
        t.end();
      });
    })();
  });

  t.test('changes - with connection refused', t => {
    (async () => {
      const host = '127.0.0.1';
      const port = await freePort();
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
      const changes = db.changes();
      let nChanges = 0;
      let nReconnects = 0;
      let nErrors = 0;
      changes.on('change', change => {
        nChanges++;
      });
      changes.on('error', err => {
        t.pass('should emit error');
        t.equal(err.name, 'Error', 'Error');
        t.equal(err.code, 'ECONNREFUSED', 'ECONNREFUSED');
        nErrors++;
        setTimeout(
          () => {
            changes.cancel();
          },
          100
        );
      });

      changes.on('reconnect', () => {
        nReconnects++;
        t.pass('should reconnect');
      });

      changes.on('cancelled', () => {
        t.equal(nChanges, 0, '0 changes');
        t.equal(nReconnects, 1, '1 reconnects');
        t.equal(nErrors, 1, '1 error');
        t.end();
      });
    })();
  });

  t.test('changes - reconnects after server terminates request', t => {
    let nRequests = 0;
    let n404Requests = 0;
    const app = express();
    app.use(express.json());
    app.get('/testdb/_changes', (req, res) => {
      nRequests++;
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      t.equal(username, 'testuser2', 'username is testuser');
      t.equal(password, 'testpass2', 'password is testpass');
      res.append('Server', 'CouchDB/3.2.0');
      res.write('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      res.write('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      res.write(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      res.write('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      res.write(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      setTimeout(() => {
        res.write('\r\r\r');
        res.write(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
        res.end();
      }, 2000);
    });
    app.use((req, res) => {
      n404Requests++;
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
      const changes = db.changes();
      let nChanges = 0;
      let nReconnects = 0;
      let nErrors = 0;
      changes.on('change', change => {
        nChanges++;
      });
      changes.on('error', err => {
        console.log('error: ', err);
        t.fail('should not emit error');
        nErrors++;
      });

      changes.on('reconnect', () => {
        t.pass('should reconnect');
        nReconnects++;
        changes.cancel();
      });

      changes.on('cancelled', () => {
        t.equal(nChanges, 10, '10 changes');
        t.equal(nReconnects, 1, '1 reconnects');
        t.equal(nRequests, 1, '1 request');
        t.equal(n404Requests, 0, '0 404 requests');
        t.equal(nErrors, 0, '0 errors');
        t.end();
      });
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
