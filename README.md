# entrain-couchdb

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
- [Database functions](#database-functions)
  - [db.get(path)](#dbgetpath)


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


## Database functions

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


## License

MIT, see [LICENSE.md](http://github.com/ig3/entrain-couchdb/blob/master/LICENSE.md) for details.
