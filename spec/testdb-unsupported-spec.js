'use strict';

var testdb = require('../index.js');
var pg = require('pg');
var Q = require('q');
var logger = require('./logger.js');

describe(__filename, function() {
  beforeEach(function() {
    var self = this;
    self.testDatabase = new testdb.TestDatabase(new logger('testdb', false));
  });

  it('unsupported', function(done) {
    var self = this;
    self.testDatabase.isSupported = function() { return false; }
    self.testDatabase
      .start()
      .then(done.bind(null, 'should have failed'))
      .fail(function(e) {
        expect(e.message).toEqual('Not supported on this platform');
        done();
      })
  });
});

