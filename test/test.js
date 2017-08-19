var expect = require('chai').expect;
var config = require('config');
var rp = require('request-promise');


var test_server_opts = config.get('test_server');
var test_db_opts = config.get('test_db');


describe('entrain-couchdb', function() {
    after('delete test database', function(done) {
        var url = 'http://' + 
            test_server_opts.hostname + ':' +
            test_server_opts.port + '/' +
            test_db_opts.db_name;
        console.log('url: ' + url);
        rp({
            method: 'DELETE',
            url: url,
            json: true,
            auth: {
                username: test_server_opts.username,
                password: test_server_opts.password
            }
        })
        .then(function(info) {
            done();
        });
    });

    it('should load', function() {
        var couchdb = require('..');
    });
    var couchdb = require('..');
    it('should export an object', function() {
        expect(couchdb).to.be.an('object');
    });

    it('should have a server function', function() {
        expect(couchdb.server).to.be.a('function');
    });

    describe('method server', function() {
        it('should throw Error Missing opts with no arguments', function() {
            expect(couchdb.server).to.throw(Error, 'Missing opts');
        });
        it('should throw TypeError not an object if opts is not', function() {
            var f = function() { couchdb.server(1); };
            expect(f).to.throw(TypeError, 'opts is not an object');
        });

        it('should return an object', function() {
            var server = couchdb.server({});
            expect(server).to.be.an('object');
        });

        var server = couchdb.server(test_server_opts);

        it('should have method db', function() {
            expect(server).to.respondTo('db');
        });

        it('should have method get', function() {
            expect(server).to.respondTo('get');
        });

        it('should have method post', function() {
            expect(server).to.respondTo('post');
        });

        describe('method get', function() {
            it('should return a promise', function(done) {
                var resp = server.get('/');
                expect(resp).to.respondTo('then');
                expect(resp).to.respondTo('catch');
                resp
                .then(function(info) { })
                .catch(function(err) { })
                .then(function() { done(); });
            });
            it('should resolve to an object', function(done) {
                var resp = server.get('/');
                expect(resp).to.respondTo('then');
                expect(resp).to.respondTo('catch');
                resp
                .then(function(info) {
                    expect(info).to.be.an('object');
                    expect(info).to.include.all.keys(
                        'couchdb',
                        'uuid',
                        'version',
                        'vendor'
                    );
                    done();
                })
                .catch(function(err) {
                    console.log(err);
                    done();
                })
            });
        });

        describe('method db', function(done) {
            before('setup test database', function(done) {
                // Delete the test database then recreate it
                var url = 'http://' + 
                    test_server_opts.hostname + ':' +
                    test_server_opts.port + '/' +
                    test_db_opts.db_name;
                console.log('url: ' + url);
                rp({
                    method: 'DELETE',
                    url: url,
                    json: true,
                    auth: {
                        username: test_server_opts.username,
                        password: test_server_opts.password
                    }
                })
                .catch(function(err) {
                    // Ignore if database doesn't exist
                })
                .then(function(info) {
                    console.log('deleted database');
                    return rp({
                        method: 'PUT',
                        url: url,
                        json: true,
                        auth: {
                            username: test_server_opts.username,
                            password: test_server_opts.password
                        }
                    });
                })
                .then(function(info) {
                    console.log('created database');
                    return rp({
                        method: 'POST',
                        url: url,
                        body: {
                            _id: 'test_doc',
                            when: new Date().toISOString()
                        },
                        json: true,
                        auth: {
                            username: test_server_opts.username,
                            password: test_server_opts.password
                        }
                    });
                })
                .then(function(info) {
                    console.log('created test_doc');
                    done();
                })
                .catch(function(err) {
                    console.log('before failed with: ', err);
                    throw err;
                });
            });


            it('should throw Error Missing opts with no arguments', function() {
                expect(server.db).to.throw(Error, 'Missing opts');
            });
            it('should throw TypeError not an object if opts is not', function() {
                var f = function() { server.db(1); };
                expect(f).to.throw(TypeError, 'opts is not an object');
            });

            it('should return an object', function() {
                var db = server.db({});
                expect(db).to.be.an('object');
            });

            var db = server.db(test_db_opts);


            it('should have method changes', function() {
                expect(db).to.respondTo('changes');
            });

            it('should have method get', function() {
                expect(db).to.respondTo('get');
            });

            it('should have method post', function() {
                expect(db).to.respondTo('post');
            });

            it('should have method purge', function() {
                expect(db).to.respondTo('purge');
            });


            describe('method db.get', function() {
                it('should return a promise', function(done) {
                    var resp = db.get('test_doc');
                    expect(resp).to.respondTo('then');
                    expect(resp).to.respondTo('catch');
                    resp
                    .then(function(info) { })
                    .catch(function(err) { })
                    .then(function() { done(); });
                });
                it('should resolve to an object', function(done) {
                    var resp = db.get('test_doc');
                    expect(resp).to.respondTo('then');
                    expect(resp).to.respondTo('catch');
                    resp
                    .then(function(info) {
                        expect(info).to.be.an('object');
                        expect(info).to.include.all.keys(
                            '_id',
                            '_rev'
                        );
                        done();
                    })
                    .catch(function(err) {
                        throw err;
                        done();
                    })
                });
            });

            describe('Method db.changes', function() {
                var changes = db.changes();
                var got_changes = new Promise(function(accept, reject) {
                    changes.on('change', function(change) {
                        console.log('change ' + JSON.stringify(change));
                        changes.cancel();
                        accept('ok');
                    });
                });

                it('should be an event emitter', function() {
                    expect(changes).to.respondTo('on');
                });
                it('should be cancellable', function() {
                    expect(changes).to.respondTo('cancel');
                });
                it('should issue change events', function(done) {
                    got_changes
                    .then(function() {
                        done();
                    });
                });
            });

            describe('Method db.post', function() {
                it('should return a promise', function(done) {
                    var resp = db.post('_bulk_docs', {
                        all_or_nothing: true,
                        docs: [ {
                            _id: 'test_doc2',
                            when: new Date().toISOString()
                        } ]
                    });
                    expect(resp).to.respondTo('then');
                    expect(resp).to.respondTo('catch');
                    resp
                    .then(function(info) { })
                    .catch(function(err) { console.log('post test_doc2 failed'); })
                    .then(function() { done(); });
                });
                it('should resolve to an array', function(done) {
                    db.post('_bulk_docs', {
                        all_or_nothing: true,
                        docs: [ {
                            _id: 'test_doc3',
                            when: new Date().toISOString()
                        } ]
                    })
                    .then(function(info) {
                        console.log('bulk docs returned ' + JSON.stringify(info));
                        expect(info).to.be.an('array');
                        done();
                    })
                    .catch(function(err) {
                        console.log('post test_doc3 failed');
                        throw err;
                    })
                });
            });

            describe('Method db.purge', function() {
                it('should return a promise', function(done) {
                    var resp = db.purge('xxx');
                    expect(resp).to.respondTo('then');
                    expect(resp).to.respondTo('catch');
                    resp
                    .then(function(info) { })
                    .catch(function(err) { })
                    .then(function() { done(); });
                });
                it('should resolve to an object', function(done) {
                    db.purge('test_doc')
                    .then(function(info) {
                        console.log('purge returned ' + JSON.stringify(info));
                        expect(info).to.be.an('object');
                        done();
                    })
                    .catch(function(err) {
                        console.log('purge test_doc failed');
                        throw err;
                    })
                });
            });
        });


        describe('Method server.post', function() {
            it('should return a promise', function(done) {
                var resp = server.post('/' + test_db_opts.db_name + '/_bulk_docs', {
                    all_or_nothing: true,
                    docs: [ {
                        _id: 'test_doc4',
                        when: new Date().toISOString()
                    } ]
                });
                expect(resp).to.respondTo('then');
                expect(resp).to.respondTo('catch');
                resp
                .then(function(info) { })
                .catch(function(err) { console.log('post test_doc4 failed'); })
                .then(function() { done(); });
            });
            it('should resolve to an object', function(done) {
                var resp = server.post('/' + test_db_opts.db_name + '/_bulk_docs', {
                    all_or_nothing: true,
                    docs: [ {
                        _id: 'test_doc5',
                        when: new Date().toISOString()
                    } ]
                })
                .then(function(info) {
                    expect(info).to.be.an('array');
                    done();
                })
                .catch(function(err) {
                    console.log('post test_doc5 failed');
                    throw err;
                })
            });
        });
    });
});
