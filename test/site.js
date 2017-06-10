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
const Crawler = require('./../index');
const Dom = require('fckffdom');
const server = require('./webpages');
const chance = new Chance();

before(function() {
	server.listen();
});

describe('Site', function() {
	const crawler = new Crawler([], {readyIn: 3});

	describe('#simulateLoading()', function() {
		it('should create a site from a string of html', function() {
			const site = new Crawler.Site('https://test.com');
			const html = '<body><div><nav>Template</nav></div><div class="content"><a href="/test.html">a</a><a href="mailto:test@test.de">mail</a><a href="https://google.com">google.com</a></div></body>';
			site.simulateLoading(html);
			assert.equal(site.dom.html(), '<div><div><div>Template</div></div><div><a href="/test.html">a</a><a href="mailto:test@test.de">mail</a><a href="https://google.com">google.com</a></div></div>');
		});
	});

	describe('#scoreNode()', function() {
		it('should score one node if it is part of the template and write that score in DOM as data-attribute', function() {
			const site = new Crawler.Site('', crawler);
			const testHtmlThree = '<body><div><nav>Template</nav></div><div class="content">Content 1<span class="a">a</span></div><a href="same">Same</a></body>';
			const compareHtml = [
				'<body><div><nav>Template</nav></div><div class="content">Content 2<span class="a">b</span></div><a href="same">Same</a></body>',
				'<body><div><nav>Template</nav></div><div class="content">Content 3<span class="a">c</span></div><a href="same">Same</a></body>',
				'<body><div><nav>Template</nav></div><div class="content">Content 4<span class="a">d</span></div></body>'
			];

			site.simulateLoading(testHtmlThree)
			const sites = compareHtml.map(html => {
				const s = new Crawler.Site();
				s.simulateLoading(html);
				return s;
			});

			site.scoreNode(
				site.dom.body(),
				sites.map(s => s.dom.body()),
				true
			);
			assert.equal(site.querySelector('.a').data('entropy'), 1);
		});
	});

	describe('#scoreDOM()', function() {
		it('should score every node if it is part of the template and write that score in DOM as data-attribute', function() {
			this.timeout(12000);
			const site = new Crawler.Site('', crawler);
			const testHtmlFour = '<body><div class="zero"><nav id="navbar">Template</nav></div><div class="content">Content 1</div></body>';
			const compareHtml = [
				'<body><div class="zero"><nav id="navbar">Template</nav></div><div class="content">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum gravida vulputate lectus luctus iaculis. Donec suscipit dui sed justo sodales consectetur.</div></body>',
				'<body><div class="zero"><nav id="navbar">Template</nav></div><div class="content"> Proin porta ultrices quam, sit amet lacinia odio finibus nec. Fusce lectus ex, tempus non aliquet non, vehicula ac magna.</div></body>',
				'<body><div class="zero"><nav id="navbar">Template</nav></div><div class="content">Fusce pellentesque, est nec auctor semper, leo arcu pellentesque diam, ut porta nibh eros ac turpis.</div></body>'
			];
			site.simulateLoading(testHtmlFour)
			const sites = compareHtml.map(html => {
				const s = new Crawler.Site();
				s.simulateLoading(html);
				return s;
			});

			site.scoreDOM(site, sites, true);
			assert.equal(Math.floor(site.dom.querySelector('.content').data('entropy')), 119);
			assert.equal(site.dom.querySelector('.zero').data('entropy'), 0);
			assert.equal(site.dom.querySelector('#navbar').data('entropy'), undefined);
			const newSite = new Crawler.Site();
			newSite.dom = new Dom('<body><div><nav>Template</nav></div><div class="content">Nullam euismod nisl non purus efficitur eleifend. Sed ultrices sodales odio. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Proin et tortor turpis. Phasellus dignissim ut augue eu cursus.</div></body>');
			sites.push(newSite)
			site.scoreDOM(site, sites, true);
			assert.equal(Math.floor(site.dom.querySelector('.content').data('entropy')), 145);
		});
	});

	describe('#returnUrls()', function() {
		it('should return all the urls from the document except mailto', function(done) {
			this.timeout(6000);
			const site = new Crawler.Site('https://test.com');
			site.dom = new Dom('<body><div><nav>Template</nav></div><div class="content"><a href="/test.html">a</a><a href="mailto:test@test.de">mail</a><a href="https://google.com">google.com</a></div></body>');
			assert.deepEqual(site.returnUrls().map(url => url.href), ['https://test.com/test.html', 'https://google.com/']);
			assert.deepEqual(site.returnUrls(site.dom).map(url => url.href), ['https://test.com/test.html', 'https://google.com/']);
			const port = server.config.port;
			const url = `http://localhost:${port}`;
			const crawler = new Crawler(url);
			crawler.workQueue();
			crawler.on('ready', () => {
				crawler.stop();
				const crawledSite = crawler.getByUrl(url);
				assert.deepEqual(crawledSite.returnUrls().map(url => url.href), [url + '/index.html',
					url + '/profile.html', url + '/details.html', url + '/german.html', 'https://budick.eu/']);
				done();
			});
		});
	});

	describe('#load()', function() {
		const port = server.config.port;
		const url = `http://localhost:${port}/index.html`;
		const crawler = new Crawler(url);
		it('should load the site from the defined url', function(done) {
			this.timeout(10000);
			const site = new Crawler.Site(url, crawler);
			site.load().then(() => {
				assert.equal(site.dom.getById(7).text(), 'Members:');
				done();
			});
		});
	});
})
;
