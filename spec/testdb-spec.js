'use strict';

var testdb = require('../index.js');
var pg = require('pg');
var Q = require('q');
var logger = require('./logger.js');

describe(__filename, function() {
  beforeEach(function(done) {
    var self = this;
    self.supported = true;
    self.testDatabase = new testdb.TestDatabase(new logger('testdb', false));
    self.testDatabase
      .start()
      .fail(function(e) {
        if(e.message === 'Not supported on this platform') {
          self.supported = false;
        } else {
          done('failed instantiation');
        }
      })
      .done(done);
  });

  it('create DATABASE and TABLE', function(done) {
    var self = this;
    if(!self.supported) {
      console.log('Warning, not supported on this platform');
      done();
    }
    self.testDatabase
      .create('testdb' + Date.now())
      .then(function(dsn) {
        var deferred = Q.defer();
        pg.connect(dsn, function(err, client, done) {
          client.query('CREATE TEMP TABLE testtable(col INTEGER)', function(err, results) {
            done();
            client.end();
            if(err) {
              deferred.reject(err);
            }
            deferred.resolve();
          });
        });
        return deferred.promise;
      })
      .then(done)
      .fail(done)
      .done();
  });

  afterEach(function(done) {
    var self = this;
    self.testDatabase
      .stop()
      .then(done)
      .fail(done)
      .done();
  });
});

