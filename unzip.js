'use strict';
// Polyfills for node 0.8
require('listenercount');
require('buffer-indexof-polyfill');
require('setimmediate');


exports.Open = require('./lib/Open');