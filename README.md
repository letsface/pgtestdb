## Overview

Instantiate database server from scratch.

Currently, the test script lib/start_test_db.sh is only tested on Ubuntu 14.04.

TODO: create one script per platform.

## Usage

See spec/testdb-spec

```
'use strict';

var TestDb = require('pgtestdb');
var testdb = new TestDb.TestDatabase(logger);
var Q = require('q');
var pg = require('pg');

var stop;

testdb
    .start()
    .then(function() {
      return testdb.create('testdb' + Date.now());
    })
    .then(function(dsn) {
      logger.log('connecting to : ' + dsn);
      var deferred = Q.defer();
      pg.connect(dsn, function(err, client, returnClientToPool) {
        stop = function() {
          client.end();
          return testdb.stop();
        };
        if(err) {
          return deferred.reject(err);
        }
        deferred.resolve();
      });
      return deferred.promise;
    })
    .then(function() {
    	return stop();
    })
    .done();

```

## debugging issues

If the test database won't start:

Temporary testdb databases are created on /dev/shm, use ```df -h``` to check that it didn't run out of space.