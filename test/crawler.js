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

const assert = require('assert');
const _ = require('underscore');
const process = require('process');
const {config} = require('./webpages');

require('dotenv').load();

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
				new Crawly.Site(url + '/german.html')
			];
			const empty = testCrawler.getByUrl('this should return nothing');
			assert.strictEqual(empty, undefined);

			const site = testCrawler.getByUrl(url + '/profile.html');
			assert.strictEqual(site.url.href, url + '/profile.html');
		});
	});

	describe('#workQueue()', function() {
		it('should store fetched html when queue is started', function(done) {
			this.timeout(3000);
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
		it('get content of a complex site', function() {
			/**
			 * Get HTML
			 */
			let content = crawler.getContent(url + '/index.html', 'HTML');
			assert.equal(content.length, 304);

			content = crawler.getContent(url + '/details.html', 'HTML');
			assert.equal(content.length, 1617);

			content = crawler.getContent(url + '/profile.html', 'HTML');
			assert.equal(content.length, 2146);

			/**
			 * Get PLAIN_TEXT
			 */
			content = crawler.getContent(url + '/index.html', 'PLAIN_TEXT');
			assert.equal(content.length, 62);

			content = crawler.getContent(url + '/details.html', 'PLAIN_TEXT');
			assert.equal(content.length, 1317);

			content = crawler.getContent(url + '/profile.html', 'PLAIN_TEXT');
			assert.equal(content.length, 836);

			/**
			 * Get default (PLAIN_TEXT)
			 */
			assert.equal(crawler.getContent(url + '/index.html', 'PLAIN_TEXT'), crawler.getContent(url + '/index.html'));
			assert.equal(crawler.getContent(url + '/details.html', 'PLAIN_TEXT'), crawler.getContent(url + '/details.html'));
			assert.equal(crawler.getContent(url + '/profile.html', 'PLAIN_TEXT'), crawler.getContent(url + '/profile.html'));
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
