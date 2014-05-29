'use strict';

var sys = require('sys');
var exec = require('child_process').exec;
var Q = require('q');
var rimraf = require('rimraf');
var util = require('util');
var pg = require('pg');
var fs = require('fs');
var path = require('path');

function TestDatabase($log) {
  var self = this;  
  
  self.TESTDBUSER = process.env['USER'];
  self.POSTGRESBINDIR = "/usr/lib/postgresql/9.3/bin";
  self.SHELLSCRIPT = path.join(__dirname, 'start_test_db.sh');
  
  self.started = false;

  var dsnFormat = "postgres://%s@localhost:%s/postgres";
  var dsnFormatDb = "postgres://%s@localhost:%s/%s";
  self.deferredStop = Q.defer();

  self.isSupported = function() {
    return fs.existsSync(self.POSTGRESBINDIR) 
      && fs.existsSync('/dev/shm')
      && fs.existsSync(self.SHELLSCRIPT);
  }

  self.start = function() {
    if(self.started) {
      return Q();
    }

    var deferredStart = Q.defer();
    if(!self.isSupported()) {
      return deferredStart.reject('Not supported');
    }

    var options = {
      env: {
        USER: self.TESTDBUSER,
        POSTGRESBINDIR: self.POSTGRESBINDIR
      }
    }
    var child = exec(self.SHELLSCRIPT, options, function (err, stdout, stderr) { 
      $log.log('postgresql server has exited');
      if(err) {
        return deferredStart.reject(err);
      }
      rimraf(self.TESTDBDIR, function() {
        $log.log('removed ' + self.TESTDBDIR);
        self.deferredStop.resolve();
      });      
    });

    child.stdout.on('data', function(out) {
      $log.log(out.trim());
      out.split('\n').map(function(line) {
        ['TESTDBPORT', 'TESTDBDIR', 'TESTDBPID'].map(function(s) {
          if(line.indexOf(s) === 0) {
            var value = line.substring((s + '=').length);
            self[s] = value;
            $log.log(s + '=' + value);
            if(s === 'TESTDBPORT') {
              self.started = true;
              deferredStart.resolve();
              self.postgresDsn = util.format(dsnFormat, self.TESTDBUSER, self.TESTDBPORT);
            }
          }
        });
      });
    });

    child.stderr.on('data', function(out) {
      $log.log(out.trim());
    }); 

    child.on('exit', function(code) {
      $log.log('child process exited with code ' + code);     
    });

    child.stdin.end();

    return deferredStart.promise;
  }

  self.create = function(dbName) {
    var deferredDsn = Q.defer();
    pg.connect(self.postgresDsn, function(err, client, done) {
      client.query('CREATE DATABASE ' + dbName, function(err, results) {
        done();
        client.end();        
        if(err) {
          deferredDsn.reject(err);
        }
        var dsn = util.format(dsnFormatDb, self.TESTDBUSER, self.TESTDBPORT, dbName);
        deferredDsn.resolve(dsn);
      });
    })
    return deferredDsn.promise;
  }

  function autostop() {
    if(self.started) {
      console.log('testdb shutdown on SIGTERM. autostop');
      self.stop().done();
    } 
  }  

  //suppressed in Jasmine test...
  process.removeListener('exit', autostop);
  process.once('exit', autostop);

  self.stop = function() {
    // fast shutdown = SIGINT
    // "smart" shutdown= SIGTERM
    process.kill(self.TESTDBPID, 'SIGINT');
    process.removeListener('exit', autostop);
    return self.deferredStop.promise;
  }
}

exports.TestDatabase = TestDatabase;