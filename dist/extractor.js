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

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _chance = require('chance');

var _chance2 = _interopRequireDefault(_chance);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _levenshtein = require('levenshtein');

var _levenshtein2 = _interopRequireDefault(_levenshtein);

var _googleNlpApi = require('google-nlp-api');

var _googleNlpApi2 = _interopRequireDefault(_googleNlpApi);

var _translate = require('@google-cloud/translate');

var _translate2 = _interopRequireDefault(_translate);

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

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
            var entropies = $('[data-entropy]').map(function (index, element) {
                return $(element).data('entropy');
            }).get();
            var sumEntropy = entropies.reduce(function (a, b) {
                return a + b;
            }, 0);
            var length = entropies.length;

            /**
             * Calculate mean
             * @type {number}
             */
            var mean = Math.round(sumEntropy / length);

            /**
             * Calcualte standard deviation
             * @type {number}
             */
            var deviation = 0;
            entropies.forEach(function (v) {
                deviation += Math.pow(parseFloat(v) - mean, 2);
            });
            deviation = Math.sqrt(deviation / length);

            _helpers2.default.traverse($('body'), function (root, args) {
                /**
                 * Normalize entropy
                 */
                args.$(root).attr('data-entropy', parseFloat(args.$(root).attr('data-entropy')) - args.mean / args.deviation);
            }, { mean: mean, deviation: deviation, $: $ });

            Extractor.cleanScoredDOM($);

            var title = $('title').text();
            var extractedDom = _cheerio2.default.load('<html><head><title>' + title + '</title></head><body></body></html>');
            _underscore2.default.forEach($('body').children(), function (node) {
                Extractor.addStrongToDOM($, node, mean, deviation, extractedDom);
            });

            return extractedDom.html();
        }

        /**
         * Delete empty or cluttered elements
         * @param $
         */

    }, {
        key: 'cleanScoredDOM',
        value: function cleanScoredDOM($) {
            $('*').each(function (index, node) {
                var element = $(node);
                if (element.text().replace(/\s|\n|\t/gi, '').length === 0) {
                    $(node).remove();
                }
            });
            var removed = 0;
            $('[data-entropy]').each(function (index, node) {
                var element = $(node);
                console.log(parseFloat(element.data('entropy')), element.data('entropy'));
                if (element.children().length === 0 && parseFloat(element.data('entropy')) <= 0) {
                    $(node).remove();
                    removed++;
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
        value: function addStrongToDOM($, node, mean, deviation, strongDOM) {
            node = $(node);
            if (parseFloat(node.data('entropy')) > 0) {
                var tag = node.prop('tagName');
                strongDOM('body').append('<' + tag + '>' + node.html() + '</' + tag + '>');
            } else {
                _underscore2.default.forEach(node.children(), function (node) {
                    return Extractor.addStrongToDOM($, node, mean, deviation, strongDOM);
                });
            }
        }
    }]);

    return Extractor;
}();

exports.default = Extractor;