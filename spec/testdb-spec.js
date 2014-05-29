'use strict';

var testdb = require('../index.js');
var pg = require('pg');
var Q = require('q');
var logger = require('./logger.js');

describe('testdb', function() {
  beforeEach(function(done) {
    var self = this;
    self.testDatabase = new testdb.TestDatabase(new logger('testdb', false));
    self.testDatabase
      .start()
      .done(done, done);      
  });

  it('create DATABASE and TABLE', function(done) {
    var self = this;    
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

