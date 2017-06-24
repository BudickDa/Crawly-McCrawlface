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
const {config} = require('./webpages');

const Crawly = require('./../index');

const cacheString = {
	persistence: {},
	get: function(key) {
		return this.persistence[key];
	},
	set: function(key, value) {
		this.persistence[key] = value;
	}
};

const cachePromise = {
	persistence: {},
	get: function(key) {
		const db = this.persistence;
		return new Promise(resolve => {
			resolve(db[key])
		});
	},
	set: function(key, value) {
		this.persistence[key] = value;
	}
};

describe('Cache', function() {
	this.timeout(20000);
	const port = config.port;
	const url = `http://localhost:${port}/index.html`;

	it('test with cache that returns string', function(done) {
		const crawler = new Crawly(url);
		crawler.setCache(cacheString);
		crawler.workQueue();
		crawler.on('ready', () => {
			crawler.stop();
			const text = cacheString.get(url);
			assert.equal(text.length, 614);
			done();
		});
	});

	it('test with cache that returns Promise', function(done) {
		const crawler = new Crawly(url);
		crawler.setCache(cachePromise);
		crawler.workQueue();
		crawler.on('ready', () => {
			crawler.stop();
			cachePromise.get(url).then(text => {
				assert.equal(text.length, 614);
				done();
			});
		});
	});
});
