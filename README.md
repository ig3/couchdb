# @ig3/couchdb

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Entrain's CouchDB client

## Install

Use [npm](https://npmjs.com/) to install.

```sh
npm install entrain-couchdb --save
```

## Table of contents

- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Server functions](#server-functions)
  - [server.db(opts)](#serverdbopts)
  - [server.get(path)](#servergetpath)
  - [server.post(path,data)](#serverpostpathdata)
- [Database functions](#database-functions)
  - [db.changes(opts)](#dbchangesopts)
  - [db.get(path)](#dbgetpath)
  - [db.post(path,data)](#dbpostpathdata)
  - [db.purge(id)](#dbpurgeid)


## Getting started

To use `entrain-couchdb` you need to connect to your CouchDB server:

```js
var couch = require('entrain-couchdb');
var server = couch.server({
    hostname: 'localhost',
    port:     5984,
    protocol: 'http',
    username: 'admin',
    password: 'secret'
});
```

To get server meta information:

```js
server.get('/')
.then(function(info) {
    console.log(info);
});
```

## Configuration

To configure entrain-couchdb to access your CouchDB server:


```js
var couch = require('entrain-couchdb');
var server = couch.server({
    hostname: 'localhost',
    port:     5984,
    protocol: 'http',
    username: 'admin',
    password: 'secret'
});
```

Or

```js
var server = require('entrain-couchdb').server({
    hostname: 'localhost',
    port:     5984,
    protocol: 'http',
    username: 'admin',
    password: 'secret'
});
```

## Server functions

### server.db(opts)

To configure a connection to a database:

```js
var db = server.db({
    db_name: 'mydb',
    username:   'user',
    password:   'mypassword'
});
```

The username and password are optional. If they are not provided, the 
username and password of the server are used.

See [Database functions](#database-functions).


### server.get(path)

HTTP GET against an arbitrary path on the server.

```js
server.get('/')
.then(function(info) {
    console.log('CouchDB meta information: ' + JSON.stringify(info));
})
.catch(function(err) {
    console.log('GET / failed with: ', err);
    throw err;
});
```

This does an HTTP GET on http://hostname:port/path.

If the path does not begin with '/' then '/' is prepended to the path.


### server.post(path,data)

Send an HTTP POST request with an arbitrary path and data.

Path is the path part of the URL to the server.

Data is and object that will be transformed to JSON and sent as the body 
of the POST request.

Returns a promise that resolves to the CouchDB response or an error.

```js
server.post('/my_db/_bulk_docs', {
    all_or_nothing: true,
    docs: [{
        _id: 'new_doc_id',
        data: 'some data'
    }]
})
.then(function(info) {
    console.log('POST response: ' + JSON.stringify(info));
})
.catch(function(err) {
    console.log('POST failed with: ', err);
    throw err;
});
```


## Database functions

### db.changes(opts)

Requests a continuous change feed and returns an event emitter that emits
the following event:

* change - for each change received
* error - if there is an error

The changes feed can be cancelled by calling the cancel() method.

```js
var changes = db.changes();

changes.on('change', function(change) {
    console.log('got a change ' + change);
});
changes.on('error', function(error) {
    console.log('oops');
});

changes.cancel();
```


### db.get(path)

HTTP GET from a path relative to the database.

```js
var id = 'some_document_id';
db.get(id)
.then(function(info) {
    console.log('got doc: ' + JSON.stringify(info));
})
.catch(function(err) {
    console.log('get ' + id + ' failed with: ', err);
    throw err;
});
```

The request is to http://hostname:port/db_name/path.

The path may include query parameters:

```js
var id = 'some_document_id';
db.get(id + '?meta=true')
.then(function(info) {
    console.log('got doc: ' + JSON.stringify(info));
})
.catch(function(err) {
    console.log('get ' + id + ' failed with: ', err);
    throw err;
});
```

### db.post(path,data)

Send an HTTP POST request with an arbitrary path and data.

Path is appended to the database name.

Data is and object that will be transformed to JSON and sent as the body 
of the POST request.

Returns a promise that resolves to the CouchDB response or an error.

```js
db.post('_bulk_docs', {
    all_or_nothing: true,
    docs: [{
        _id: 'new_doc_id',
        data: 'some data'
    }]
})
.then(function(info) {
    console.log('POST response: ' + JSON.stringify(info));
})
.catch(function(err) {
    console.log('POST failed with: ', err);
    throw err;
});
```


### db.purge(id)

Purge the document with the given id from the database.

Returns a promise wich resolves to an info object if the doc is purged
or an error.


```js
db.purge('some_id')
.then(function(info) {
    console.log('document was purged');
})
.catch(function(err) {
    console.log('purge failed with ', err);
});
```


### db.put(path, data)

Submit an HTTP PUT request to path, prefixed with database name, and
with given data.

Returns a promise wich resolves to an info object or an error.

```js
db.put('new_doc', {
    _id: 'new_doc',
    data: 'some data'
})
.then(function(info) {
    console.log('put succeeded');
})
.catch(function(err) {
    console.log('put failed with ', err);
});
```

### db.soft_delete(doc)

Given a doc, set property deleted\_time to current time and \_deleted to true.

Returns a promise that resolves to the updated version of the doc or
an error.

```js
db.get('some_doc')
.then(function(doc) {
    return db.soft_delete(doc);
})
.then(function(info) {
    console.log('put succeeded');
})
.catch(function(err) {
    console.log('put failed with ', err);
});
```


## License

MIT, see [LICENSE.md](http://github.com/ig3/entrain-couchdb/blob/master/LICENSE.md) for details.
