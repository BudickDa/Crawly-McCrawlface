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
const Chance = require('chance');
const FckffDOM = require('fckffdom');
const Crawler = require('./../index');
const Classifier = Crawler.Classifier;
const LinkQuotaFilter = Classifier.LinkQuotaFilter;

describe('Classifier', function() {
	describe('#classify()', function() {
		it('should classify node', function() {
			const dom = new FckffDOM('<div id="node">Test</div>');
			assert.equal(Classifier.classify(dom.querySelector('#node')), 0);
		});
	});

	describe('#textDensity()', function() {
		it('should classify node', function() {
			const dom = new FckffDOM('<div id="node">Test <span>Child with text</span> Some more text, this should have a really high textdensity!</div>');
			assert.equal(Classifier.textDensity(dom.querySelector('#node')), 27);
		});
	});

	describe('#isPartOfNav()', function() {
		it('should check if node is part of nav', function() {
			const dom = new FckffDOM('<div id="node"><nav><li  id="home"><a>Home</a></li><li><a>Profile</a></li></nav><main id="content"><p>This is text and a <a>link</a> that belongs to content.</p></main></div>');
			assert.equal(Classifier.isPartOfNav(dom.querySelector('#home')), true);
			assert.equal(Classifier.isPartOfNav(dom.querySelector('#content')), false);
		});
	});
});

describe('LinkQuotaFilter', function() {
	describe('#measure()', function() {
		it('should classify node', function() {
			const dom = new FckffDOM('<div id="node"><p>This is a paragraph. <a>Link</a></p></div>');
			assert.equal(LinkQuotaFilter.measure(dom.querySelector('#node')), 0, 'One p and one a should return one');
		});
	});
});
