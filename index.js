require("babel-core/register");
require("babel-polyfill");

const Crawly = require('./lib/crawly').default;
module.exports = Crawly;
