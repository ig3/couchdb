var expect = require('chai').expect;
var config = require('config');


console.log('config sources: ' + JSON.stringify(config.util.getConfigSources()));
console.log('NODE_ENV: ' + config.util.getEnv('NODE_ENV'));

console.log('config: ' + JSON.stringify(config));

var test_server_opts = config.get('test_server');

console.log('test_server_opts: ' + JSON.stringify(test_server_opts));

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

        describe('get', function() {
            it('should not throw', function() {
                var f = function() { server.get('/'); };
                expect(f).to.not.throw();
            });
            it('should return a promise', function() {
                var resp = server.get('/');
                expect(resp).to.respondTo('then');
                expect(resp).to.respondTo('catch');
            });
        });
    });

});
