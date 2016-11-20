import 'babel-polyfill';
const Cheerio = require('cheerio');
const assert = require('assert');
const redis = require('redis');
const _ = require('underscore');

const Crawly = require('./../index');

describe('Crawler', function() {
  const crawler = new Crawly('https://budick.eu');

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
      crawler.on('finished', () => {
        const site = crawler.getByUrl('https://budick.eu/impressum');
        assert.equal(site.url.href, 'https://budick.eu/impressum');
        done();
      });
    });
  });

  describe('#getContent()', function() {
    it('should return the content without clutter', function() {
      this.timeout(5000);
      const content = crawler.getContent('https://budick.eu/impressum');
      assert.equal(content.length > 2000, true);
    });
  });
});
