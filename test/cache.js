const assert = require('assert');
const _ = require('underscore');

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
	const url = 'https://de.wikipedia.org/wiki/Test';
	const crawler = new Crawly(url);
	crawler.setCache(cache);
	crawler.workQueue();

	it('test', function(done) {
		crawler.on('ready', () => {
			const text = cache.get(url);
			assert.equal(typeof text, 'string');
			done();
		});
	});
});
