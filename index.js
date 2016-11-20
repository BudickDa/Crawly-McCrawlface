require('babel-core/register');
require('babel-regenerator-runtime')
require('babel-polyfill');

const Crawly = require('./dist/crawly').default;
Crawly.Site = require('./dist/site').default;
module.exports = Crawly;
