const assert = require('assert');
const _ = require('underscore');
const {config} = require('./webpages');

const Crawly = require('./../index');
const cache = {
	persistence: {},
	get: function(key) {
		return this.persistence[key];
	},
	set: function(key, value) {
		this.persistence[key] = value;
	}
};



describe('Cache', function() {
	this.timeout(5000);
	const port = config.port;
	const url = `http://localhost:${port}/index.html`;

	const crawler = new Crawly(url);
	crawler.setCache(cache);
	crawler.workQueue();
	crawler.options.readyIn = 3;

	it('test', function(done) {
		crawler.on('ready', () => {
			crawler.stop();
			const text = cache.get(url);
			assert.equal(text.length, 483);
			done();
		});
	});
});
