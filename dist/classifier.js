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

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fckffdom = require('fckffdom');

var _fckffdom2 = _interopRequireDefault(_fckffdom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinkQuotaFilter = function () {
	function LinkQuotaFilter() {
		_classCallCheck(this, LinkQuotaFilter);
	}

	_createClass(LinkQuotaFilter, null, [{
		key: 'measure',
		value: function measure(node) {
			if (!node instanceof _fckffdom2.default.Node) {
				throw new TypeError('Parameter node in LinkQuotaFilter.measure has to be a cheerio node. Or must have the function html() and text()');
			}
			if (node.isLeaf()) {
				return 0;
			}
			var childLeafs = node.getChildren().filter(function (c) {
				return c.isLeaf();
			});
			if (childLeafs.length === 0) {
				return 0;
			}
			var boilerTags = ['a', 'l', 'd'];
			var boilerChilds = childLeafs.filter(function (c) {
				return _lodash2.default.includes(boilerTags, c.getType());
			});

			var contentTags = ['p', 'h'];
			var contentChilds = childLeafs.filter(function (c) {
				return _lodash2.default.includes(contentTags, c.getType());
			});

			return contentChilds.length / (boilerChilds.length || 1);
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
			if (!node instanceof _fckffdom2.default.Node) {
				throw new TypeError('Parameter node in Classifier.classify has to be a cheerio node. Or must have the function html() and text()');
			}

			/**
    * If DOM has only one node, things get weird... let's prevent weirdness:
    */
			if (node._dom._nodes.length === 1) {
				return node._text.length;
			}

			if (Classifier.isPartOfNav(node)) {
				return 0;
			}

			var textDensity = Classifier.textDensity(node);

			return textDensity + LinkQuotaFilter.measure(node);
		}

		/**
   * Calculates length of text of children divided by number of children
   * @param node
   * @returns {*}
   */

	}, {
		key: 'textDensity',
		value: function textDensity(node) {
			var childLeafs = node.getChildren().filter(function (c) {
				return c.isLeaf();
			});
			var childLeafsLength = childLeafs.length;
			if (childLeafsLength === 0) {
				return 0;
			}
			var textLength = childLeafs.map(function (c) {
				return c.getText();
			}).join('').length;

			return textLength / (childLeafsLength || 1);
		}

		/**
   * Looks for hyperlinks in list items, which are typical for navbars
   * @param node
   * @returns {*|boolean}
   */

	}, {
		key: 'isPartOfNav',
		value: function isPartOfNav(node) {
			return node.getChildren().length === 1 && node.getChildren()[0].getType() === 'a' && node.getType() === 'l';
		}
	}]);

	return Classifier;
}();

Classifier.LinkQuotaFilter = LinkQuotaFilter;
exports.default = Classifier;