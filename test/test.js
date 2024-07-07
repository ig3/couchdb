'use strict';

const t = require('tape');
const nock = require('nock');
nock.disableNetConnect();

t.test('basic', t => {
  require('..');
  t.end();
});

t.test('no options', t => {
  t.throws(() => {
    require('..')();
  }, /Missing opts/, 'throws without options');
  t.end();
});

t.test('connect', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get(
    uri => {
      return uri === '/';
    },
    body => {
      return true;
    }
  )
  .reply(200, {
    couchdb: 'Welcome',
    silly: 'nonsense',
  });

  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
  });
  const x = couchdb.get('/');
  t.equal(typeof x.then, 'function', 'returns a promise');
  t.equal(typeof x.catch, 'function', 'returns a promise');
  x.then(result => {
    t.equal(typeof result, 'object', 'resolves to an object');
    t.equal(result.couchdb, 'Welcome', 'returns welcome message');
    t.end();
  });
});

t.test('get throws on error reponse', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get(
    uri => {
      return uri === '/bad-path';
    },
    body => {
      return true;
    }
  )
  .reply(404, 'invalid request');

  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
  });
  const x = couchdb.get('/bad-path');
  x.then(result => {
    t.fail('should not resolve');
    t.end();
  })
  .catch(err => {
    t.pass('should reject');
    t.equal(err.message, 'request failed: 404', 'reject on 404');
    t.equal(err.response, 'invalid request', 'error includes response body');
    t.end();
  });
});

t.test('get throws on request error', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get(
    uri => {
      return uri === '/bad-path';
    },
    body => {
      return true;
    }
  )
  .reply(404, 'invalid request');

  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
  });
  const x = couchdb.get('/test');
  x.then(result => {
    t.fail('should not resolve');
    t.end();
  })
  .catch(err => {
    t.pass('should reject');
    t.equal(err.code, 'ERR_NOCK_NO_MATCH', 'Error code is ERR_NOCK_NO_MATCH');
    t.end();
  });
});

t.test('server.post', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .post(
    uri => { // This will be called twice
      t.equal(uri, '/test/_bulk_docs', 'uri');
      return true;
    },
    body => {
      // { docs: [ { _id: 'test_doc1', when: '2023-11-03T08:28:37.996Z' } ] }
      t.equal(typeof body, 'object', 'body type');
      t.equal(typeof body.docs, 'object', 'body contains docs');
      t.equal(body.docs[0]._id, 'test_doc1', 'docs contains test_doc1');
      t.equal(body.docs[0].data, 'This is a test', 'document content');
      return true;
    }
  )
  .reply(200, [
    { ok: true, id: 'test_doc1', rev: '1-9a4921b3df5cd5788e4ff31362f92f29' },
  ]);
  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  couchdb.post('/test/_bulk_docs', {
    docs: [{
      _id: 'test_doc1',
      data: 'This is a test',
    }],
  })
  .then(info => {
    t.pass('should resolve');
    // [{"ok":true,"id":"test_doc1","rev":"1-9a4921b3df5cd5788e4ff31362f92f29"}]\n'
    t.equal(info[0].ok, true, 'should succeed');

    t.end();
  })
  .catch(err => {
    console.log('err: ', err);
    t.fail('should not reject');
    t.end();
  });
});

t.test('db.post', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .post(
    uri => { // This will be called twice
      t.equal(uri, '/test/_bulk_docs', 'uri');
      return true;
    },
    body => {
      // { docs: [ { _id: 'test_doc1', when: '2023-11-03T08:28:37.996Z' } ] }
      t.equal(typeof body, 'object', 'body type');
      t.equal(typeof body.docs, 'object', 'body contains docs');
      t.equal(body.docs[0]._id, 'test_doc1', 'docs contains test_doc1');
      t.equal(body.docs[0].data, 'This is a test', 'document content');
      return true;
    }
  )
  .reply(201, [
    { ok: true, id: 'test_doc1', rev: '1-9a4921b3df5cd5788e4ff31362f92f29' },
  ]);
  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  db.post('_bulk_docs', {
    docs: [{
      _id: 'test_doc1',
      data: 'This is a test',
    }],
  })
  .then(info => {
    t.pass('should resolve');
    // [{"ok":true,"id":"test_doc1","rev":"1-9a4921b3df5cd5788e4ff31362f92f29"}]\n'
    t.equal(info[0].ok, true, 'should succeed');

    t.end();
  })
  .catch(err => {
    console.log('err: ', err);
    t.fail('should not reject');
    t.end();
  });
});

t.test('db.soft_delete', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .put(
    uri => { // This will be called twice
      t.equal(uri, '/test/xxx', 'uri');
      return true;
    },
    body => {
      // { docs: [ { _id: 'test_doc1', when: '2023-11-03T08:28:37.996Z' } ] }
      t.equal(typeof body, 'object', 'body type');
      t.equal(body._id, 'xxx', 'body._id');
      t.equal(body._deleted, true, 'body.deleted');
      return true;
    }
  )
  .reply(200, {
    ok: true,
    id: 'xxx',
    rev: '1-9a4921b3df5cd5788e4ff31362f92f29',
  })
  .get(
    uri => { // This will be called twice
      t.equal(uri, '/test/xxx', 'uri');
      return true;
    }
  )
  .reply(200, {
    _id: 'xxx',
    _deleted: true,
    deleted_time: 'some time',
    _rev: 'new rev',
  });
  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  db.soft_delete({
    _id: 'xxx',
  })
  .then(info => {
    t.pass('should resolve');
    t.equal(info._rev, 'new rev', 'document revision');
    t.equal(info.deleted_time, 'some time', 'document revision');
    t.end();
  })
  .catch(err => {
    console.log('err: ', err);
    t.fail('should not reject');
    t.end();
  });
});

t.test('db.purge', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get(
    uri => { // This will be called twice
      t.equal(uri, '/test/xxx', 'uri');
      return true;
    }
  )
  .reply(200, {
    ok: true,
    id: 'xxx',
    rev: '1-9a4921b3df5cd5788e4ff31362f92f29',
    _revs_info: [
      {
        rev: '3-asdf',
        status: 'available',
      },
      {
        rev: '2-asdf',
        status: 'available',
      },
    ],
  })
  .post(
    uri => { // This will be called twice
      t.equal(uri, '/test/_purge', 'uri');
      return true;
    }
  )
  .reply(200, {
    purge_seq: null,
    purged: {
      xxx: [
        '3-asdf',
      ],
    },
  });
  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  db.purge('xxx')
  .then(info => {
    // { purge_seq: null, purged: { xxx: [ '3-asdf' ] } }
    t.pass('should resolve');
    t.equal(info.purge_seq, null, 'null purge sequence');
    t.equal(typeof info.purged.xxx, 'object', 'document id');
    t.equal(info.purged.xxx.length, 1, 'array length');
    t.end();
  })
  .catch(err => {
    console.log('err: ', err);
    t.fail('should not reject');
    t.end();
  });
});

t.test('db.changes', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get(
    uri => { // This will be called twice
      t.equal(uri, '/test/_changes', 'uri');
      return true;
    }
  )
  .query(query => {
    t.equal(query.feed, 'continuous', 'query feed');
    t.equal(query.heartbeat, '30000', 'query heartbeat');
    return true;
  })
  .reply(
    200,
    (uri, requestBody) => {
      const { Readable } = require('stream');
      const inStream = new Readable({
        read () {},
      });
      inStream.push('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      inStream.push('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      inStream.push(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      inStream.push(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('\r\r\r');
      inStream.push(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      return inStream;
    },
    {
      Server: 'CouchDB/3.2.0',
    }
  );
  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  const changes = db.changes();

  let nChanges = 0;
  changes.on('change', change => {
    nChanges++;
  });

  changes.on('error', err => {
    console.log('got a changes error: ', err);
  });

  changes.on('reconnect', () => {
    t.fail('should not reconnect');
  });

  setTimeout(() => {
    changes.cancel();
  }, 5000);

  changes.on('cancelled', () => {
    t.pass('got cancelled event');
    t.equal(nChanges, 10, '10 changes');
    t.end();
  });
});

t.test('db.changes - bad server', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get(
    uri => { // This will be called twice
      t.equal(uri, '/test/_changes', 'uri');
      return true;
    }
  )
  .query(query => {
    t.equal(query.feed, 'continuous', 'query feed');
    t.equal(query.heartbeat, '30000', 'query heartbeat');
    return true;
  })
  .reply(
    200,
    (uri, requestBody) => {
      const { Readable } = require('stream');
      const inStream = new Readable({
        read () {},
      });
      inStream.push('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      inStream.push('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      inStream.push(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      inStream.push(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('\r\r\r');
      inStream.push(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      return inStream;
    },
    {
      Server: 'BAD SERVER/3.2.0',
    }
  );
  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  const changes = db.changes();

  let nChanges = 0;
  changes.on('change', change => {
    nChanges++;
  });

  changes.on('error', err => {
    t.equal(err.message, 'Not CouchDB', 'Error message is Not CouchDB');
  });

  changes.on('reconnect', () => {
    t.pass('should reconnect');
  });

  setTimeout(() => {
    changes.cancel();
  }, 5000);

  changes.on('cancelled', () => {
    t.pass('got cancelled event');
    t.equal(nChanges, 0, '0 changes');
    t.end();
  });
});

t.test('db.changes.reconnect', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get('/test/_changes')
  .query(query => {
    t.equal(query.feed, 'continuous', 'query feed continuous');
    t.equal(query.heartbeat, '30000', 'query heartbeat 30000');
    return true;
  })
  .reply(
    200,
    (uri, requestBody) => {
      const { Readable } = require('stream');
      const inStream = new Readable({
        read () {},
      });
      inStream.push('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      inStream.push('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      inStream.push(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      inStream.push(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('\r\r\r');
      inStream.push(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      return inStream;
    },
    {
      Server: 'CouchDB/3.2.0',
    }
  )
  .get('/test/_changes')
  .query(query => {
    t.equal(query.feed, 'continuous', 'query feed continuous');
    t.equal(query.heartbeat, '30000', 'query heartbeat 30000');
    return true;
  })
  .reply(
    200,
    (uri, requestBody) => {
      const { Readable } = require('stream');
      const inStream = new Readable({
        read () {},
      });
      inStream.push('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      inStream.push('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      inStream.push(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      inStream.push(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('\r\r\r');
      inStream.push(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      return inStream;
    },
    {
      Server: 'CouchDB/3.2.0',
    }
  )
  .get('/test/_changes')
  .query(query => {
    t.equal(query.feed, 'continuous', 'query feed continuous');
    t.equal(query.heartbeat, '30000', 'query heartbeat 30000');
    return true;
  })
  .reply(
    200,
    (uri, requestBody) => {
      const { Readable } = require('stream');
      const inStream = new Readable({
        read () {},
      });
      inStream.push('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}]}\n');
      inStream.push('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      inStream.push(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      inStream.push(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('\r\r\r');
      inStream.push(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      return inStream;
    },
    {
      Server: 'CouchDB/3.2.0',
    }
  );

  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  const changes = db.changes();

  let nChanges = 0;
  let nReconnects = 0;

  changes.on('change', change => {
    nChanges++;
  });

  changes.on('error', err => {
    t.fail('should not emit error');
    console.log('got a changes error: ', err);
  });

  changes.on('reconnect', () => {
    nReconnects++;
  });

  changes.on('cancelled', () => {
    t.equal(nChanges, 20, '20 changes');
    t.equal(nReconnects, 1, '1 reconnect');
    t.end();
  });

  changes.reconnect();

  setTimeout(() => {
    changes.cancel();
  }, 15000);
});

t.test('db.changes - with corrupt change', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get(
    uri => {
      t.equal(uri, '/test/_changes', 'get /test/_changes');
      return true;
    }
  )
  .query(query => {
    t.equal(query.feed, 'continuous', 'query feed continuouse');
    t.equal(query.heartbeat, '30000', 'query heartbeat 30000');
    return true;
  })
  .reply(
    200,
    (uri, requestBody) => {
      const { Readable } = require('stream');
      const inStream = new Readable({
        read () {},
      });
      inStream.push('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}],bad json}\n');
      inStream.push('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      inStream.push(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      inStream.push(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('\r\r\r');
      inStream.push(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      return inStream;
    },
    {
      Server: 'CouchDB/3.2.0',
    }
  )
  .post(
    uri => { // This will be called twice
      t.equal(uri, '/test/_purge', 'post /test/_purge');
      return true;
    }
  )
  .reply(200, {
    purge_seq: null,
    purged: {
      xxx: [
        '3-asdf',
      ],
    },
  });
  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  const changes = db.changes();

  let nChanges = 0;
  let nErrors = 0;
  changes.on('change', change => {
    nChanges++;
  });

  changes.on('error', () => {
    t.pass('should emit error');
    nErrors++;
  });

  changes.on('reconnect', () => {
    t.fail('should not reconnect');
  });

  setTimeout(() => {
    changes.cancel();
  }, 5000);

  changes.on('cancelled', () => {
    t.equal(nChanges, 9, '9 changes');
    t.equal(nErrors, 1, '1 error');
    t.end();
  });
});

t.test('db.changes - with server error', t => {
  nock.cleanAll();
  nock('http://localhost:5984')
  .get('/some/path')
  .reply(
    200,
    (uri, requestBody) => {
      const { Readable } = require('stream');
      const inStream = new Readable({
        read () {},
      });
      inStream.push('{"seq":"1-g1AAAAB5eJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zEhnwKMpjAZIMDUDqP0htBnMiYy5QgN3INCkx0cQUm74sAJQtIFo","id":"b3775776561011de158fc6551c0004ac","changes":[{"rev":"1-59414e77c768bc202142ac82c2f129de"}],bad json}\n');
      inStream.push('{"seq":"2-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTGXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFcUoSQ","id":"71091c1418986a91aa593474b600476e","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}\n');
      inStream.push(`{"seq":"3-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTGMGmGZkmJSaamGLTlwUAFjUoSg","id":"71091c1418986a91aa593474b6007c28","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"5-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTmMGmGZkmJSaamGLTlwUAFnkoTA","id":"test_doc1","changes":[{"rev":"2-85c07d92c45b53acc1bc9429c2b5f9d1"}]}
{"seq":"6-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAFukoTQ","id":"71091c1418986a91aa593474b6008b09","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('{"seq":"7-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTmXOBAuyJlsnmBhaG2DTg');
      inStream.push(`MSaPBUgyNACp_1DTWMCmGZkmJSaamGLTlwUAFwsoTg","id":"71091c1418986a91aa593474b60017f0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      inStream.push('\r\r\r');
      inStream.push(`{"seq":"8-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_yimGZkmJSaamGLTlwUAF3soTw","id":"71091c1418986a91aa593474b600b7a0","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"9-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DTWMGmGZkmJSaamGLTlwUAF50oUA","id":"71091c1418986a91aa593474b600308c","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"10-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MCmGZkmJSaamGLTlwUAF78oUQ","id":"71091c1418986a91aa593474b6005a50","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
{"seq":"11-g1AAAACbeJzLYWBgYMpgTmEQTM4vTc5ISXIwNDLXMwBCwxyQVCJDUv3___-zMpgTWXKBAuyJlsnmBhaG2DTgMSaPBUgyNACp_1DT2MGmGZkmJSaamGLTlwUAF-EoUg","id":"71091c1418986a91aa593474b600b396","changes":[{"rev":"1-967a00dff5e02add41819138abb3284d"}]}
`);
      return inStream;
    },
    {
      Server: 'CouchDB/3.2.0',
    }
  );

  const couchdb = require('..')({
    hostname: 'localhost',
    port: 5984,
    username: 'test',
    password: 'test',
  });
  const db = couchdb.db({
    db_name: 'test',
    username: 'test',
    password: 'test',
  });
  const changes = db.changes();

  let nChanges = 0;
  let nErrors = 0;
  let nReconnects = 0;

  changes.on('change', change => {
    nChanges++;
  });

  changes.on('error', (err) => {
    t.pass('should emit error');
    t.equal(err.code, 'ERR_NOCK_NO_MATCH', 'error ERR_NOCK_NO_MATCH');
    nErrors++;
  });

  changes.on('reconnect', () => {
    t.pass('should attempt reconnect');
    nReconnects++;
  });

  setTimeout(() => {
    changes.cancel();
  }, 5000);

  changes.on('cancelled', () => {
    t.equal(nChanges, 0, '0 changes');
    t.equal(nErrors, 1, '1 error');
    t.equal(nReconnects, 1, '1 reconnect');
    t.end();
  });
});
