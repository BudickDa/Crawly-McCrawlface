'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by Daniel Budick on 25 Mär 2017.
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

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinkQuotaFilter = function () {
	function LinkQuotaFilter() {
		_classCallCheck(this, LinkQuotaFilter);
	}

	_createClass(LinkQuotaFilter, null, [{
		key: 'measure',
		value: function measure(node) {
			if (!_helpers2.default.isNode(node)) {
				throw new TypeError('Parameter node in LinkQuotaFilter.measure has to be a cheerio node. Or must have the function html() and text()');
			}
			var layout = ['a', 'aside', 'button', 'div', 'main', 'nav', 'li', 'ul'];
			var content = ['abbr', 'address', 'article', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'span', 'p'];
			var c = content.reduce(function (memo, el) {
				if (typeof memo === 'string') {
					memo = _helpers2.default.count(node, memo);
				}
				return memo + _helpers2.default.count(node, el);
			});
			var l = layout.reduce(function (memo, el) {
				if (typeof memo === 'string') {
					memo = _helpers2.default.count(node, memo);
				}
				return memo + _helpers2.default.count(node, el);
			});
			return c / (l || 1);
		}
	}]);

	return LinkQuotaFilter;
}();

/**
 * Scores node with several features (higher is always better):
 * - Text density (text / html)
 * - LQF (Link Quota Filter): Content elements vs layout elements as children
 * - Images as children
 * - Paragraphs as children
 * - inverse Hyperlinks: 1 / number of anker tags
 * - inverse Divs: 1 / number of div tags
 * - teh: Looks for words like 'is' or 'the' in multiple languages
 */


var Classifier = function () {
	function Classifier() {
		_classCallCheck(this, Classifier);
	}

	_createClass(Classifier, null, [{
		key: 'classify',
		value: function classify(node) {
			if (!_helpers2.default.isNode(node)) {
				throw new TypeError('Parameter node in Classifier.classify has to be a cheerio node. Or must have the function html() and text()');
			}

			if (node[0] && node[0].name.toLowerCase() === 'a' || node[0] && node[0].name.toLowerCase().match(/h[1-6]/i)) {
				if (Classifier.isPartOfNav(node)) {
					return -9001;
				}
			}

			var textDensity = _helpers2.default.textDensity(node);
			var lqf = LinkQuotaFilter.measure(node);
			var imageNumber = _helpers2.default.count(node, 'img') + _helpers2.default.count(node, 'svg');
			var paragraphs = _helpers2.default.count(node, 'a');

			var countHyperlinks = _helpers2.default.count(node, 'a');
			var inverseHyperlinks = countHyperlinks ? 1 / countHyperlinks : 0;

			var divCount = _helpers2.default.count(node, 'div');
			var inverseDivs = divCount ? 1 / divCount : 0;

			var words = ['is', 'the', 'le', 'la', 'der', 'die', 'das'];
			var teh = words.reduce(function (memo, word) {
				if (typeof memo === 'string') {
					memo = (node.text().match(new RegExp(memo, 'gi')) || []).length;
				}
				return memo + (node.text().match(new RegExp(word, 'gi')) || []).length;
			});

			return textDensity + lqf + imageNumber + paragraphs + inverseHyperlinks + inverseDivs + teh;
		}
	}, {
		key: 'isPartOfNav',
		value: function isPartOfNav(node) {
			try {
				if (node.parent()[0].name.toLowerCase() === 'li') {
					var density = _helpers2.default.textDensity(node.parent().parent().parent());
					return density < 0.5;
				}
				var parentDensity = _helpers2.default.textDensity(node.parent());
				return parentDensity < 0.5;
			} catch (e) {
				return true;
			}
		}
	}]);

	return Classifier;
}();

Classifier.LinkQuotaFilter = LinkQuotaFilter;
exports.default = Classifier;