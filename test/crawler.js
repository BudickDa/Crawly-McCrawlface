/**
 * Created by Daniel Budick on 17 Mär 2017.
 * Copyright 2017 Daniel Budick All rights reserved.
 * Contact: daniel@budick.eu / http://budick.eu
 *
 * This file is part of Crawler McCrawlface
 * Crawler McCrawlface is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Crawler McCrawlface is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Crawler McCrawlface. If not, see <http://www.gnu.org/licenses/>.
 */

const assert = require('assert');
const _ = require('underscore');
const process = require('process');
const Cheerio = require('cheerio');
const {config} = require('./webpages');

require('dotenv').load();

const Crawler = require('./../index');

describe('Crawler', function() {
	const port = config.port;
	const url = `http://localhost:${port}`;
	const crawler = new Crawler(url);

	describe('#getByUrl()', function() {
		it('should return a site from the crawler via its url', function() {
			const testCrawler = new Crawler();
			testCrawler.sites = [
				new Crawler.Site(url),
				new Crawler.Site(url + '/details.html'),
				new Crawler.Site(url + '/profile.html'),
				new Crawler.Site(url + '/german.html')
			];
			const empty = testCrawler.getByUrl('this should return nothing');
			assert.strictEqual(empty, undefined);

			const site = testCrawler.getByUrl(url + '/profile.html');
			assert.strictEqual(site.url.href, url + '/profile.html');
		});
	});

	describe('#workQueue()', function() {
		it('should store fetched html when queue is started', function(done) {
			this.timeout(5000);
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
		it('get HTML of index.html', function() {
			const $ = Cheerio.load(crawler.getContent(url + '/index.html', 'HTML'));
			$('body *').each((index, element) => {
				assert($(element).attr('entropy') > 0);
			});
		});
		it('get HTML of details.html', function() {
			const $ = Cheerio.load(crawler.getContent(url + '/details.html', 'HTML'));
			$('body *').each((index, element) => {
				assert($(element).attr('entropy') > 0);
			});
		});
		it('get HTML of profile.html', function() {
			const $ = Cheerio.load(crawler.getContent(url + '/profile.html', 'HTML'));
			$('body *').each((index, element) => {
				assert($(element).attr('entropy') > 0);
			});
		});

		it('get PLAIN_TEXT of index.html', function() {
			const content = crawler.getContent(url + '/index.html', 'PLAIN_TEXT');
			assert(content.length > 75);
			assert(content.length < 100);
		});

		it('get PLAIN_TEXT of details.html', function() {
			const content = crawler.getContent(url + '/details.html', 'PLAIN_TEXT');
			assert(content.length > 1250);
			assert(content.length < 1350);
		});

		it('get PLAIN_TEXT of profile.html', function() {
			const content = crawler.getContent(url + '/profile.html', 'PLAIN_TEXT');
			assert(content.length > 800);
			assert(content.length < 900);
		});

		it('PLAIN_TEXT is same as no variable', function() {
			assert.equal(crawler.getContent(url + '/index.html', 'PLAIN_TEXT'), crawler.getContent(url + '/index.html'));
			assert.equal(crawler.getContent(url + '/details.html', 'PLAIN_TEXT'), crawler.getContent(url + '/details.html'));
			assert.equal(crawler.getContent(url + '/profile.html', 'PLAIN_TEXT'), crawler.getContent(url + '/profile.html'));
		});

		it('get text from wikipedia to test performance', function(done) {
			this.timeout(60000);
			const url = 'https://de.wikipedia.org/wiki/Test';
			const wikiCrawler = new Crawler(url);
			wikiCrawler.workQueue();
			wikiCrawler.on('ready', c => {
				c.stop();
				const $ = Cheerio.load(wikiCrawler.getContent(url, 'HTML'));
				$('body *').each((index, element) => {
					assert(($(element).attr('entropy') > 0) || ($(element).children().length > 0));
				});
				done();
			});
		});
	});

	describe('#getData()', function() {
		this.timeout(6000);
		it('get data of a complex english site', function(done) {
			crawler.getData(url + '/profile.html').then(data => {
				//console.log(util.inspect(data, {depth: null}));
				if (process.env.GOOGLE_NLP_API) {
					const person = _.first(_.where(data.entities, {type: 'PERSON'}));
					assert.equals(person.name, 'Daniel Budick');
				}
				done();
			}).catch(err => {
				if (!process.env.GOOGLE_NLP_API) {
					assert.deepStrictEqual(err, new Error('Please supply Google NLP API key as environment variable GOOGLE_NLP_API'));
				}
				done();
			});
		});
		it('get data of a complex german site', function(done) {
			crawler.getData(url + '/profile.html').then(data => {
				//console.log(util.inspect(data, {depth: null}));
				if (process.env.GOOGLE_NLP_API) {
					const person = _.first(_.where(data.entities, {type: 'PERSON'}));
					assert.equals(person.name, 'Daniel Budick');
				}
				done();
			}).catch(err => {
				if (!process.env.GOOGLE_NLP_API) {
					assert.deepStrictEqual(err, new Error('Please supply Google NLP API key as environment variable GOOGLE_NLP_API'));
				}
				done();
			});
		});
	});
});
