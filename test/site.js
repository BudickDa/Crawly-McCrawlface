const Cheerio = require('cheerio');
const assert = require('assert');
const Chance = require('chance');
const redis = require('redis');
const Crawly = require('./../index');
const chance = new Chance();

describe('Site', function() {
  const crawler = new Crawly();

  describe('#cleanDOM()', function() {
    it('should clean the dom from empty nodes, styles and scripts but not images', function() {
      const site = new Crawly.Site('', crawler);
      const testOneResult = site.cleanDOM(Cheerio.load('<style></style><div><script></script><span>Test</span><div></div><img></div>'));

      assert.equal(testOneResult.html(), '<div><span>Test</span><img></div>');

      site.$ = Cheerio.load('<style></style><div><script></script><span>Test</span><div></div><img></div>');
      site.cleanDOM();

      assert.equal(site.$.html(), '<div><span>Test</span><img></div>');
    });
  });

  describe('#getOnlyText()', function() {
    it('should return text of node, not text, that is part of children', function() {
      const site = new Crawly.Site('', crawler);
      site.$ = Cheerio.load('<div id="target">This should be returned!<span>This should be ignored</span><div>This should be ignored too.</div></div>');
      assert.equal(site.getOnlyText(site.$('#target')), 'This should be returned!');
      assert.equal(site.getOnlyText(site.$('#target'), site), 'This should be returned!');
    });
  });

  describe('#scoreNode()', function() {
    it('should score one node if it is part of the template and write that score in DOM as data-attribute', function() {
      const site = new Crawly.Site('', crawler);
      const testThree = Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 1<span>a</span></div></body>');
      const compareDomsOne = [
        Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 2<span>b</span></div></body>'),
        Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 3<span>c</span></div></body>'),
        Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 4<span>d</span></div></body>')
      ];
      site.$ = testThree;
      const sites = compareDomsOne.map(dom => {
        const s = new Crawly.Site();
        s.$ = dom;
        return s;
      });

      site.scoreNode(
        testThree('body'),
        compareDomsOne.map(element => {
          return element('body');
        }),
        site,
        sites
      );
      assert.equal(testThree('.content').data('score'), 3);
      assert.equal(testThree('.content').data('full-score'), 6);
    });
  });

  describe('#scoreDOM()', function() {
    it('should score every node if it is part of the template and write that score in DOM as data-attribute', function() {
      const site = new Crawly.Site('', crawler);
      const testThree = Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 1<span>a</span></div></body>');
      const testFour = Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 1</div></body>');
      const pages = [
        Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum gravida vulputate lectus luctus iaculis. Donec suscipit dui sed justo sodales consectetur.</div></body>'),
        Cheerio.load('<body><div><nav>Template</nav></div><div class="content"> Proin porta ultrices quam, sit amet lacinia odio finibus nec. Fusce lectus ex, tempus non aliquet non, vehicula ac magna.</div></body>'),
        Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Fusce pellentesque, est nec auctor semper, leo arcu pellentesque diam, ut porta nibh eros ac turpis.</div></body>')
      ];
      site.$ = testFour;
      const sites = pages.map(dom => {
        const s = new Crawly.Site();
        s.hash = chance.hash();
        s.$ = dom;
        return s;
      });
      site.scoreDOM(site, sites);
      assert.equal(site.$('.content').data('score'), 360);
    });
  });

  describe('#returnUrls()', function() {
    it('should return all the urls from the document except mailto', function() {
      const site = new Crawly.Site('https://test.com', crawler);
      site.$ = Cheerio.load('<body><div><nav>Template</nav></div><div class="content"><a href="/test.html">a</a><a href="mailto:test@test.de">mail</a><a href="https://google.com">google.com</a></div></body>');
      assert.deepEqual(site.returnUrls().map(url => url.href), ['https://test.com/test.html', 'https://google.com/']);
      assert.deepEqual(site.returnUrls(site.$).map(url => url.href), ['https://test.com/test.html', 'https://google.com/']);
    });
  });

  describe('#load()', function() {
    it('should load the site from the defined url', function(done) {
      this.timeout(10000);
      const site = new Crawly.Site('https://de.wikipedia.org/wiki/Test', crawler);
      site.load().then(() => {
        assert.equal(site.$('h1').html(), 'Test');
        assert.equal(site.html('h1'), 'Test');
        done();
      });
    });
  });
});
