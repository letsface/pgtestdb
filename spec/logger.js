'use strict';

function Logger(prefix, callthrough) {
  if(arguments.length === 1) {
    callthrough = !!process.env['API_NG_DEBUG_ENABLED'];
  }

  function log() {
    if(prefix) {
      [].unshift.call(arguments, prefix);
    }
    console.log.apply(console, arguments)

  }

  this.log = log;
  this.error = log;
  this.info = log;
  this.debug = log;

  if(callthrough) {
    spyOn(this, 'log').andCallThrough();
    spyOn(this, 'error').andCallThrough(); 
    spyOn(this, 'info').andCallThrough();
    spyOn(this, 'debug').andCallThrough();
  } else {
    spyOn(this, 'log');
    spyOn(this, 'error'); 
    spyOn(this, 'info');
    spyOn(this, 'debug');
  }
}
   
module.exports = Logger;