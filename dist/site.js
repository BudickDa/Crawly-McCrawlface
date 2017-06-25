'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * You should have received a copy of the GNU Affero General Public License
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * along with Crawly McCrawlface. If not, see <http://www.gnu.org/licenses/>.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fckffdom = require('fckffdom');

var _fckffdom2 = _interopRequireDefault(_fckffdom);

var _myHelpers = require('my-helpers');

var _myHelpers2 = _interopRequireDefault(_myHelpers);

var _leven = require('leven');

var _leven2 = _interopRequireDefault(_leven);

var _classifier = require('./classifier');

var _classifier2 = _interopRequireDefault(_classifier);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Site = function () {
	function Site(url, crawler) {
		_classCallCheck(this, Site);

		if (crawler) {
			this.crawler = crawler;
		} else {
			//console.info('This constructor should not be called manually.')
		}
		if (url) {
			this.url = _url2.default.parse(url);
			this.domain = _url2.default.parse(_url2.default.resolve(this.url.href, '/'));
		}
		this.ready = false;
		this.scored = false;
		this.scores = [];
	}

	_createClass(Site, [{
		key: 'load',
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								if (!(this.url && this.crawler)) {
									_context.next = 7;
									break;
								}

								_context.next = 3;
								return this.crawler.getDOM(this.url.href);

							case 3:
								this.dom = _context.sent;

								if (this.dom.body()) {
									this.hash = this.dom.body().hash();
								}
								this.ready = true;
								return _context.abrupt('return', this);

							case 7:
								return _context.abrupt('return', false);

							case 8:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function load() {
				return _ref.apply(this, arguments);
			}

			return load;
		}()
	}, {
		key: 'simulateLoading',
		value: function simulateLoading(html) {
			var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'http://localhost:3000';
			var crawler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.crawler;

			this.crawler = crawler;
			this.dom = new _fckffdom2.default(html);
			if (this.dom.body()) {
				this.hash = this.dom.body().hash();
			}
			this.ready = true;
			this.url = _url2.default.parse(url);
			this.domain = _url2.default.parse(_url2.default.resolve(this.url.href, '/'));
			return this;
		}
	}, {
		key: 'html',
		value: function html(selector) {
			if (selector) {
				return this.dom.querySelector(selector).map(function (node) {
					return node.html();
				});
			}
			return this.dom.html();
		}
	}, {
		key: 'querySelector',
		value: function querySelector(selector) {
			return this.dom.querySelector(selector);
		}
	}, {
		key: 'getContent',
		value: function getContent() {
			var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'HTML';
			var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			if (!this.scored || force) {
				this.scoreDOM();
			}

			var cleanedDom = _lodash2.default.cloneDeep(this.dom);

			if (!this.activateSchnuffelMode) {
				var meanScore = _myHelpers2.default.mean(this.scores);
				var deviationScore = _myHelpers2.default.standardDeviation(this.scores, meanScore);
				cleanedDom._nodes.forEach(function (node) {
					var score = (parseFloat(node.data('score')) - meanScore) / (deviationScore || 1);
					node.data('score', score);
					if (score < 0) {
						node.remove();
					}
				});
			} else {
				cleanedDom._nodes.forEach(function (node) {
					var entropies = [parseFloat(node.data('entropy'))];
					node.getSiblings().forEach(function (s) {
						entropies.push(parseFloat(s.data('entropy')));
					});
					var meanEntropy = _myHelpers2.default.mean(entropies);
					var deviationEntropy = _myHelpers2.default.standardDeviation(entropies, meanEntropy);

					var entropy = (parseFloat(node.data('entropy')) - meanEntropy) / (deviationEntropy || 1);
					node.data('entropy', entropy);
					if (entropy < 0) {
						node.remove();
					}
				});
			}

			if (type === 'PLAIN_TEXT') {
				return cleanedDom.text().trim();
			}
			if (type === 'HTML') {
				return cleanedDom.html().trim();
			}
			if (type === 'CLEANEVAL') {
				return cleanedDom.cleaneval().trim();
			}
		}
	}, {
		key: 'returnUrls',
		value: function returnUrls() {
			var _this = this;

			var $ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.$;

			var urls = [];
			this.dom.getLinks().forEach(function (href) {
				if (href.indexOf('mailto:') !== -1) {
					return;
				}
				if (href.indexOf('.pdf') !== -1) {
					return;
				}
				var parsedUrl = _url2.default.parse(href);
				parsedUrl.hash = null;
				if (parsedUrl.hostname !== null) {
					urls.push(parsedUrl);
				} else {
					var absoluteUrl = _url2.default.resolve(_this.domain.href, href);
					urls.push(_url2.default.parse(absoluteUrl));
				}
			});
			return _lodash2.default.uniqBy(urls, function (url) {
				return url.href;
			});
		}
	}, {
		key: 'scoreNode',
		value: function scoreNode(node, otherNodes, allHashes) {
			var _this2 = this;

			/**
    * Score it by distance to other sites aka. entropy
    */
			var text = node.text();
			var entropy = 0;
			/**
    * Test if enough sites were crawled.
    * If not use only Classifier.
    */
			if (this.activateSchnuffelMode) {

				var sameContext = otherNodes.filter(function (n) {
					return n && n.hash() === node.hash();
				}).filter(function (n) {
					var parent = n.getParent();
					if (parent) {
						return _myHelpers2.default.compareText(parent.getText(), node.getText()) > 0.8;
					}
					return false;
				});
				if (sameContext.length > 0) {
					node.setData('entropy', -sameContext.length);
					entropy -= sameContext.length;
				}

				if (_lodash2.default.includes(allHashes, function (n) {
					return n === node.hash();
				})) {
					entropy -= node.getText().length;
				}

				var lengthSites = otherNodes.length;
				for (var i = 0; i < lengthSites; i++) {
					if (!otherNodes[i]) {
						entropy += text.length;
					} else {
						var otherText = otherNodes[i].text();
						entropy += (0, _leven2.default)(this.clean(text), this.clean(otherText));
					}
				}
			} else {
				var _Classifier$classify = _classifier2.default.classify(node),
				    textDensity = _Classifier$classify.textDensity,
				    lqf = _Classifier$classify.lqf,
				    partOfNav = _Classifier$classify.partOfNav;

				var offset = 0;
				if (partOfNav) {
					offset -= text;
				}
				var score = (textDensity + lqf) / 2;
				node.setData('score', score);
				this.scores.push(score);
			}

			if (!node.isLeaf()) {
				var childEntropies = node.getChildren().map(function (child, index) {
					return _this2.scoreNode(child, otherNodes.map(function (n) {
						return n.getChildren()[index];
					}).filter(function (n) {
						return n instanceof _fckffdom2.default.Node;
					}), allHashes);
				});
				entropy += _lodash2.default.sum(childEntropies);
			}

			node.setData('entropy', entropy);
			return entropy;
		}
	}, {
		key: 'clean',
		value: function clean(text) {
			return text.replace(/\t|\n/gi, '');
		}

		/**
   * This functions runs only once per DOM. For repeated scoring set parameter force true.
   * @param site
   * @param sites
   * @param force (Boolean) if true the DOM is scored again
   * @returns {*}
   */

	}, {
		key: 'scoreDOM',
		value: function scoreDOM() {
			var site = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this;
			var sites = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.crawler.sites;

			sites = sites.filter(function (s) {
				return site.domain.hostname === s.domain.hostname;
			});
			/**
    * Sites with the same hash are filtered out.
    * The resulting array should contain only unique sites.
    * @type {Array.<*>}
    */
			var otherSites = sites.filter(function (s) {
				return site.hash !== s.hash;
			});

			var allHashes = _lodash2.default.flatten(otherSites.map(function (s) {
				return s.dom._nodes.filter(function (n) {
					return n.isLeaf();
				}).map(function (n) {
					return n.getHash();
				});
			}));

			this.activateSchnuffelMode = otherSites.length > 0;
			this.scoreNode(site.dom.body(), otherSites.map(function (s) {
				return s.dom.body();
			}), allHashes);
			this.scored = true;
		}
	}]);

	return Site;
}();

exports.default = Site;