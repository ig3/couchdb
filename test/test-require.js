'use strict';
// Test require of couchdb module

const t = require('tape');

t.test('require and instantiate', t => {
  t.test('basic require', t => {
    const couchdb = require('..');
    t.equal(typeof couchdb, 'function', 'returns a function');
    t.end();
  });

  t.test('throws if no options', t => {
    t.throws(
      () => {
        const couchdb = require('..')();
        t.ok(couchdb, 'couchdb has a value');
      },
      /Missing opts/,
      'Throws error if instantiated without options'
    );
    t.end();
  });
});
