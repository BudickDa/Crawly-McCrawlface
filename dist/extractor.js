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

var Extractor = function () {
	function Extractor() {
		_classCallCheck(this, Extractor);
	}

	_createClass(Extractor, null, [{
		key: 'extractContent',
		value: function extractContent($) {
			Extractor.normalizeDOM($);
			Extractor.cleanScoredDOM($);
			var title = $('title').text();
			var extractedDom = _cheerio2.default.load('<html><head><title>' + title + '</title></head><body scored=true></body></html>');
			_underscore2.default.forEach($('body').children(), function (node) {
				Extractor.addStrongToDOM(node, $, extractedDom);
			});
			return extractedDom.html();
		}
	}, {
		key: 'normalizeDOM',
		value: function normalizeDOM($) {
			//console.log($.html());
			if ($('body').attr('normalized')) {
				return;
			}

			var entropies = {
				'a': [],
				'default': []
			};

			$('[entropy]').each(function (index, element) {
				var entropy = parseFloat($(element).attr('entropy'));
				var name = $(element).prop('name').toLowerCase();
				if (Array.isArray(entropies[name])) {
					entropies[name].push(entropy);
				} else {
					entropies['default'].push(entropy);
				}
			});
			var mean = {};
			var deviation = {};
			for (var index in entropies) {
				mean[index] = _helpers2.default.mean(entropies[index]);
				deviation[index] = _helpers2.default.deviation(entropies[index]);
			}

			$('body').attr('normalized', true);
			_helpers2.default.traverse($('body'), function (root, args) {
				var name = args.$(root).prop('name');
				var key = 'default';
				if (args.mean[name]) {
					key = name;
				}
				/**
     * Normalize entropy
     */
				var entropy = args.$(root).attr('entropy') - args.mean[key] / (args.deviation[key] || 1);
				args.$(root).attr('entropy', entropy);
			}, { mean: mean, deviation: deviation, $: $ });
		}

		/**
   * Delete empty or cluttered elements
   * @param $
   */

	}, {
		key: 'cleanScoredDOM',
		value: function cleanScoredDOM($) {
			var removed = 0;
			$('body *').each(function (index, node) {
				var element = $(node);

				var valueAsString = element.attr('entropy');
				var entropy = 0;
				if (typeof valueAsString === 'number') {
					entropy = valueAsString;
				}
				if (typeof valueAsString === 'string') {
					/*
      Little workaround to get rid of , set by i18n in some browsers
      */
					entropy = parseFloat(valueAsString.replace(/\./g, '').replace(',', '.'));
				}

				if (entropy <= 0 || element.text().replace(/\s|\t|\n/gi, '').length === 0) {
					if (element.children().length === 0) {
						element.remove();
						removed++;
					}
					if (element.prop('tagName') === 'A') {
						element.remove();
						removed++;
					}
				}
			});
			if (removed !== 0) {
				Extractor.cleanScoredDOM($);
			}
		}

		/**
   * Adds strong nodes from DOM ($) to DOM provided as parameter strongDOM
   * @param $
   * @param node
   * @param mean
   * @param deviation
   * @param strongDOM
   */

	}, {
		key: 'addStrongToDOM',
		value: function addStrongToDOM(node, $, strongDOM) {
			node = $(node);
			var entropy = node.attr('entropy');
			if (entropy > 0) {
				var tag = node.prop('tagName');
				strongDOM('body').append('<' + tag + ' entropy=' + entropy + '>' + node.html() + '</' + tag + '>');
			} else {
				_underscore2.default.forEach(node.children(), function (node) {
					return Extractor.addStrongToDOM(node, $, strongDOM);
				});
			}
		}
	}]);

	return Extractor;
}();

exports.default = Extractor;