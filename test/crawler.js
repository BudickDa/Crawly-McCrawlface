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

	describe('#addFilter()', function() {
		this.timeout(6000);
		it('should only allow regex or string', function() {
			const fail = new Crawler(url);
			assert.throws(() => {
				fail.addFilter(1);
			}, TypeError);
			assert.throws(() => {
				fail.addFilter();
			}, TypeError);
			assert.throws(() => {
				fail.addFilter({});
			}, TypeError);
			assert.throws(() => {
				fail.addFilter([]);
			}, TypeError);

			const noFail = new Crawler(url);
			const filters = [];
			const regex = new RegExp(/profile\.html/, 'i');
			noFail.addFilter(regex);
			filters.push(regex);
			assert.deepEqual(noFail.filters, filters);

			const string = 'details.html';
			noFail.addFilter(string);
			filters.push(string);
			assert.deepEqual(noFail.filters, filters);
		});

		it('should only crawl site profile.html and the seed index.html', function(done) {
			const onlyProfile = new Crawler(url);
			onlyProfile.addFilter(new RegExp(/profile\.html/, 'i'));
			onlyProfile.start();
			onlyProfile.on('finished', c => {
				onlyProfile.stop();
				assert.equal(onlyProfile.sites.length, 2);
				done();
			});
		});

		it('should only crawl site profile.html and details.html and the seed index.html', function(done) {
			const onlyProfileAndDetails = new Crawler(url);
			onlyProfileAndDetails.addFilter(new RegExp(/profile\.html/, 'i'));
			onlyProfileAndDetails.addFilter('details.html');
			onlyProfileAndDetails.start();
			onlyProfileAndDetails.on('finished', c => {
				c.stop();
				assert.equal(onlyProfileAndDetails.sites.length, 3);
				done();
			});
		});
	});

	describe('#workQueue()', function() {
		it('should store fetched html when queue is started', function(done) {
			this.timeout(5000);
			crawler.workQueue();
			crawler.on('ready', c => {
				c.stop();
				const siteOne = c.getByUrl(url + '/details.html');
				assert.equal(siteOne.url.href, url + '/details.html');
				const siteTwo = c.getByUrl(url + '/profile.html');
				assert.equal(siteTwo.url.href, url + '/profile.html');
				done();
			});
		});
	});

	describe('#each()', function() {
		this.timeout(6000);
		it('iterate through all the sites', function() {
			let i = 0;
			crawler.each(site => {
				assert(site instanceof Crawler.Site);
				i++;
			});
			assert.equal(i, crawler.sites.length);
		});
	});

	describe('#getContent()', function() {
		it('get HTML of index.html', function(done) {
			crawler.getContent(url + '/index.html', 'HTML').then(html => {
				const $ = Cheerio.load(html);
				$('body *').each((index, element) => {
					assert($(element).attr('entropy') > 0);
				});
				done();
			}).catch(done);
		});
		it('get HTML of details.html', function(done) {
			crawler.getContent(url + '/details.html').then(html => {
				const $ = Cheerio.load(html, 'HTML');
				$('body *').each((index, element) => {
					assert($(element).attr('entropy') > 0);
				});
				done();
			}).catch(done);
		});
		it('get HTML of profile.html', function(done) {
			crawler.getContent(url + '/profile.html').then(html => {
				const $ = Cheerio.load(html, 'HTML');
				$('body *').each((index, element) => {
					assert($(element).attr('entropy') > 0);
				});
				done();
			}).catch(done);
		});

		it('get PLAIN_TEXT of index.html', function(done) {
			crawler.getContent(url + '/index.html', 'PLAIN_TEXT').then(content => {
				assert(content.length > 30);
				assert(content.length < 100);
				done();
			}).catch(done);
		});
		it('get PLAIN_TEXT of details.html', function(done) {
			crawler.getContent(url + '/details.html', 'PLAIN_TEXT').then(content => {
				assert(content.length > 1250);
				assert(content.length < 1450);
				done();
			}).catch(done);
		});
		it('get PLAIN_TEXT of profile.html', function(done) {
			crawler.getContent(url + '/profile.html', 'PLAIN_TEXT').then(content => {
				assert(content.length > 700);
				assert(content.length < 900);
				done();
			}).catch(done);
		});

		it('get CLEANEVAL of index.html', function(done) {
			crawler.getContent(url + '/index.html', 'CLEANEVAL').then(content => {
				console.log(content);
				const result = Crawler.Helpers.compareText(content, `<h>Members:

				<l>Daniel Budick | 1989 | Engineer
				
				`);
				console.log(result);
				assert(result > 0.8);
				done();
			}).catch(done);
		});
		it('get CLEANEVAL of details.html', function(done) {
			crawler.getContent(url + '/details.html', 'CLEANEVAL').then(content => {
				console.log(content);
				const result = Crawler.Helpers.compareText(content, `<h>Lorem Ipsum
    <p>Vivamus elementum est non purus interdum, nec lobortis arcu lacinia. Quisque ornare dapibus massa ac condimentum.
        Duis sollicitudin ante eu erat lobortis pharetra. Sed viverra risus orci. Praesent rutrum, quam ut imperdiet
        dictum, lectus tellus dignissim metus, et ullamcorper tortor massa congue tortor. Etiam vulputate aliquam
        aliquam. Ut risus quam, aliquam quis dolor in, elementum accumsan purus. Praesent tempus vel justo et efficitur.
        Vivamus ut dictum libero. Suspendisse vel purus ultrices, vestibulum tellus non, bibendum nisl. Pellentesque ut
        molestie elit. Donec malesuada augue ac dui congue tincidunt. Orci varius natoque penatibus et magnis dis
        parturient montes, nascetur ridiculus mus. Pellentesque ultricies sapien non eleifend porttitor. Aliquam at
        nulla quis eros porta molestie ac dignissim magna.

    <p>Vivamus suscipit ullamcorper ante at euismod. Ut at est eu nisl placerat dapibus id egestas neque. Praesent orci
        mi, lacinia sed commodo sit amet, tincidunt venenatis dolor. Vivamus vitae justo ac elit varius vestibulum eu
        eget dolor. Nulla varius nisi velit, quis auctor augue finibus eu. Phasellus eget tellus nulla. Duis ac enim
        dignissim, lobortis erat eget, venenatis elit.
				`);
				console.log(result);
				assert(result > 0.8);
				done();
			}).catch(done);
		});
		it('get CLEANEVAL of profile.html', function(done) {
			crawler.getContent(url + '/profile.html', 'CLEANEVAL').then(content => {
				console.log(crawler.getByUrl(url + '/profile.html').$.html());
				console.log(content);
				const result = Crawler.Helpers.compareText(content, `<h>Daniel Budick, B.Eng.

				Phone:
				+49 (0)911 - 980 328 49
				
				Mail:
				daniel@budick.eu
				
				Address:
				Zehentweg 11a,
				90768 Fürth
				Germany

        <h>About me
        <p>Daniel Budick (born 1989) is a freelancing developer creating
            web apps, native apps and backends. He started programming
            with 16 and became a freelancer with 24. 2015 he founded
            budick.eu - software engineering.
            He has a special interest in data mining, machine learning,
            text analysis and dialog systems. His main languages are:
            JavaScript, Java, C#, Python and PHP.`);
				console.log(result);
				assert(result > 0.8);
				done();
			}).catch(done);
		});


		describe('#eachHTML()', function() {
			this.timeout(6000);
			it('iterate through all the sites', function(done) {
				let i = 0;
				crawler.eachHTML(html => {
					i++;
					assert.equal(typeof html, 'string');
					if (i === crawler.sites.length) {
						done();
					}
				});
			});
		});

		describe('#eachText()', function() {
			this.timeout(6000);
			it('iterate through all the sites', function(done) {
				let i = 0;
				crawler.eachText(text => {
					i++;
					assert.equal(typeof text, 'string');
					if (i === crawler.sites.length) {
						done();
					}
				});
			});
		});


		/*describe('#getData()', function() {
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
		 });*/
	});
});
