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

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Helpers = function () {
	function Helpers() {
		_classCallCheck(this, Helpers);
	}

	_createClass(Helpers, null, [{
		key: 'traverse',
		value: function traverse(root, fnc, args) {
			root = args.$(root);
			fnc(root, args);
			_underscore2.default.forEach(root.children(), function (node) {
				return Helpers.traverse(node, fnc, args);
			});
		}

		/**
   * Calculate mean out of array
   * @param array
   * @returns {number}
   */

	}, {
		key: 'mean',
		value: function mean(array) {
			if (!Array.isArray(array)) {
				throw new TypeError('Parameter of mean must be an array.');
			}
			var sum = array.reduce(function (a, b) {
				return a + b;
			}, 0);
			var length = array.length || 1;
			return sum / length;
		}

		/**
   * Calcualte standard deviation
   * @param array
   * @returns {number}
   */

	}, {
		key: 'deviation',
		value: function deviation(array) {
			var mean = Helpers.mean(array);
			var deviation = 0;
			array.forEach(function (v) {
				deviation += Math.pow(parseFloat(v) - mean, 2);
			});
			return Math.sqrt(deviation / array.length);
		}
	}]);

	return Helpers;
}();

exports.default = Helpers;