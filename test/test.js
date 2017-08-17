var expect = require('chai').expect;
var config = require('config');


var test_server_opts = config.get('test_server');
var test_db_opts = config.get('test_db');


describe('entrain-couchdb', function() {
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

        it('should have method get', function() {
            expect(server).to.respondTo('get');
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

        it('should have method db', function() {
            expect(server).to.respondTo('db');
        });

        describe('method db', function() {
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


            it('should have method get', function() {
                expect(db).to.respondTo('get');
            });


            describe('method get', function() {
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
        });
    });
});
