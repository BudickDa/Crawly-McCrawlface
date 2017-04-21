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
const Helpers = Crawler.Helpers;

describe('Helpers', function() {
	describe('#isNode()', function() {
		it('should return false (wrong parameter)', function() {
			assert.equal(Helpers.isNode('string'), false, 'Should fail, wrong parameter type (string)');
			assert.equal(Helpers.isNode(), false, 'Should fail, wrong parameter type (empty)');
		});
		it('should return true', function() {
			const $ = Cheerio.load('<div id="node"></div>');
			assert.equal(Helpers.isNode($('#node')), true);
		});
	});

	describe('#count()', function() {
		it('should return the number of p', function() {
			const $ = Cheerio.load('<div id="node"><div><p></p></div><p><p></p></p><p></p></div>');
			assert.equal(Helpers.count($('#node'),'p'), 5);
		});
	});

	describe('#textDensity()', function() {
		it('should return one', function() {
			const $ = Cheerio.load('<div id="node"><div><p>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</p></div><p>AAAAAAAAAAA</p><p>AAAAAAAAAAAAAAAAAAAAAAAA</p><p>AAAAAAAAAAAAAAAAAAA</p></div>');
			assert.equal(Helpers.textDensity($('#node')), 0.7);
		});
	});
});
