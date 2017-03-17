/**
 * Created by Daniel Budick on 17 Mär 2017.
 * Copyright 2017 Daniel Budick All rights reserved.
 * Contact: daniel@budick.eu / http://budick.eu
 *
 * This file is part of Crawly McCrawlface
 * Crawly McCrawlface is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Crawly McCrawlface is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Crawly McCrawlface. If not, see <http://www.gnu.org/licenses/>.
 */

const Cheerio = require('cheerio');
const assert = require('assert');
const Chance = require('chance');
const Crawly = require('./../index');
const server = require('./webpages');
const chance = new Chance();

before(function() {
	server.listen();
});

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

	describe('#html2text()', function() {
		it('should convert html to text, add a linebreak before and after block elements, linebreaks after paragraphs, a tab before list items', function() {
			const site = new Crawly.Site('', crawler);
			const html = '<div><p>This is a paragraph</p><h2>Followed by a headline</h2><ul><li>Point A</li><li>Point B</li></ul><ol><li>Point A</li><li>Point B</li></ol><h1>Headline</h1><p>Paragraph</p><div>This is a div.</div></div>';
			const expected = 'This is a paragraph\n Followed by a headline\n \n\tPoint A\n \tPoint B\n \n \n\tPoint A\n \tPoint B\n \n Headline\n Paragraph\n \nThis is a div.\n \n ';
			assert.equal(site.html2text(html), expected);
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
			assert.equal(parseInt(site.$('.content').attr('data-entropy')), 36);
		});
	});

	describe('#returnUrls()', function(done) {
		it('should return all the urls from the document except mailto', function() {
			const site = new Crawly.Site('https://test.com', crawler);
			site.$ = Cheerio.load('<body><div><nav>Template</nav></div><div class="content"><a href="/test.html">a</a><a href="mailto:test@test.de">mail</a><a href="https://google.com">google.com</a></div></body>');
			assert.deepEqual(site.returnUrls().map(url => url.href), ['https://test.com/test.html', 'https://google.com/']);
			assert.deepEqual(site.returnUrls(site.$).map(url => url.href), ['https://test.com/test.html', 'https://google.com/']);

			const port = server.config.port;
			const url = `http://localhost:${port}`;
			const crawler = new Crawly(url);
			crawler.options.readyIn = 3;
			crawler.workQueue();
			crawler.on('ready', () => {
				assert.deepEqual(site.returnUrls().map(url => url.href), [url + '/index.html', url + '/details.html', url + '/profile.html']);
				done();
			});

		});
	});

	describe('#load()', function() {
		const port = server.config.port;
		const url = `http://localhost:${port}/index.html`;
		const crawler = new Crawly(url);
		it('should load the site from the defined url', function(done) {
			this.timeout(10000);
			const site = new Crawly.Site(url, crawler);
			site.load().then(() => {
				assert.equal(site.$('h1').html(), 'Members:');
				assert.equal(site.html('h1'), 'Members:');
				done();
			});
		});
	});
});
