const Cheerio = require('cheerio');
const assert = require('assert');
const redis = require('redis');
const _ = require('underscore');

const Crawly = require('./../index');

describe('Crawler', function() {
  const crawler = new Crawly('https://de.wikipedia.org/wiki/Test');

  describe('#getByUrl()', function() {
    it('should return a site from the crawler via its url', function() {
      const testCrawler = new Crawly();
      testCrawler.sites = [
        new Crawly.Site('http://test.com'),
        new Crawly.Site('http://test.com/asdf'),
        new Crawly.Site('http://test.com/foo.html'),
        new Crawly.Site('http://test.com/1234.php'),
        new Crawly.Site('http://test.com/xyz/1')
      ];
      const empty = testCrawler.getByUrl('this should return nothing');
      assert.strictEqual(empty, undefined);

      const url = 'http://test.com/asdf';
      const site = testCrawler.getByUrl(url);
      assert.strictEqual(site.url.href, url);
    });
  });

  describe('#workQueue()', function() {
    it('should store fetched html to redis db when queue is started', function(done) {
      this.timeout(30000);
      crawler.workQueue();
      crawler.on('ready', () => {
        const site = crawler.getByUrl('https://de.wikipedia.org/wiki/Test');
        assert.equal(site.url.href, 'https://de.wikipedia.org/wiki/Test');
        done();
      });
    });
  });

  describe('#getContent()', function() {
    it('get content of complex site', function(done) {
      this.timeout(20000);
      const url = 'https://de.wikipedia.org/wiki/Test';
      const c = new Crawly(url);
      c.workQueue();
      c.on('ready', () => {
        c.stop();
        const site = c.getByUrl(url);
        const content = c.getContent(url);
				assert.equal(content.length > 2000, true);
        done();
      });
    });
  });
});
