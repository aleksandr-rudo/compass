var assert = require('assert');
var startup = require('../');

describe('electron-squirrel-startup', function() {
  it('should return false by default', function() {
    assert.equal(startup, false);
  });
});
