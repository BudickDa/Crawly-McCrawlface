require("babel-core/register");
require("babel-polyfill");

const Crawly = require('./lib/crawly').default;
Crawly.Site = require('./lib/site').default;
module.exports = Crawly;
