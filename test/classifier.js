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
const Classifier = Crawler.Classifier;
const LinkQuotaFilter = Classifier.LinkQuotaFilter;

describe('Classifier', function() {
	describe('#classify()', function() {
		it('should classify node', function() {
			const $ = Cheerio.load('<div id="node"></div>');
			assert.equal(Classifier.classify($('#node')), 0);
		});
	});
});

describe('LinkQuotaFilter', function() {
	describe('#measure()', function() {
		it('should classify node', function() {
			const $ = Cheerio.load('<div id="node"><p>This is a paragraph. <a>Link</a></p></div>');
			assert.equal(LinkQuotaFilter.measure($('#node')), 1, 'One p and one a should return one');
		});
	});
});
