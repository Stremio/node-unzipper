var directory = require('./directory');
var Stream = require('stream');

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');

module.exports = {
  url: function(innerFile, params, options) {
    if (typeof params === 'string')
      params = {url: params};
    if (!params.url)
      throw 'URL missing';
    params.headers = params.headers || {};

    var source = {
      stream: function(offset,length) {
        return innerFile.createReadStream({ start: offset, end: length ? offset + length : innerFile.length -1 })
      },
      size: function() {
        return Promise.resolve(innerFile.length)
      },
      opts: function() {
        return options
      }
    };

    return directory(source, options);
  },
};
