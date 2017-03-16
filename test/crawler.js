const Cheerio = require('cheerio');
const assert = require('assert');
const _ = require('underscore');
const {config} = require('./webpages');

const Crawly = require('./../index');

describe('Crawler', function() {
	const port = config.port;
	const url = `http://localhost:${port}`;
	const crawler = new Crawly(url);

	describe('#getByUrl()', function() {
		it('should return a site from the crawler via its url', function() {
			const testCrawler = new Crawly();
			testCrawler.sites = [
				new Crawly.Site(url),
				new Crawly.Site(url + '/details.html'),
				new Crawly.Site(url + '/profile.html'),
			];
			const empty = testCrawler.getByUrl('this should return nothing');
			assert.strictEqual(empty, undefined);

			const site = testCrawler.getByUrl(url + '/profile.html');
			assert.strictEqual(site.url.href, url + '/profile.html');
		});
	});

	describe('#workQueue()', function() {
		it('should store fetched html when queue is started', function(done) {
			this.timeout(20000);
			crawler.options.readyIn = 4;
			crawler.workQueue();
			crawler.on('ready', () => {
				crawler.stop();
				const siteOne = crawler.getByUrl(url + '/details.html');
				assert.equal(siteOne.url.href, url + '/details.html');
				const siteTwo = crawler.getByUrl(url + '/profile.html');
				assert.equal(siteTwo.url.href, url + '/profile.html');
				done();
			});
		});
	});

	describe('#getContent()', function() {
		it('get content of complex site', function() {
			let content = crawler.getContent(url + '/index.html');
			console.log('index:');
			console.log(content);
			assert.equal(content.length, 222);

			content = crawler.getContent(url + '/details.html');
			console.log('details:');
			console.log(content);
			assert.equal(content.length, 1290);

			content = crawler.getContent(url + '/profile.html');
			console.log('profile:');
			console.log(content);
			assert.equal(content.length, 1772);
		});
	});
});
