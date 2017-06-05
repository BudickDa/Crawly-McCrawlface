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

var _xxhashjs = require('xxhashjs');

var _xxhashjs2 = _interopRequireDefault(_xxhashjs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _extractor = require('./extractor');

var _extractor2 = _interopRequireDefault(_extractor);

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
		this.scores = [];
		this.entropies = [];
		this.content = {};
		this.ready = false;
	}

	_createClass(Site, [{
		key: 'load',
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
				var $, text;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								if (!(this.url && this.crawler)) {
									_context.next = 12;
									break;
								}

								_context.next = 3;
								return this.crawler.getDOM(this.url.href);

							case 3:
								$ = _context.sent;
								text = $('body').html();

								if (!text) {
									text = '';
								}
								this.hash = _xxhashjs2.default.h32(text, 0xABCD).toString(16);
								this.$ = this.cleanDOM($);
								this.original = this.$.html();
								this.crawler.originals.push({
									$: this.$,
									hash: this.hash
								});
								this.ready = true;
								return _context.abrupt('return', this);

							case 12:
								return _context.abrupt('return', false);

							case 13:
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
			var crawler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.crawler;

			this.crawler = crawler;
			var $ = _cheerio2.default.load(html);
			var text = $('body').html();
			if (!text) {
				text = '';
			}
			this.hash = _xxhashjs2.default.h32(text, 0xABCD).toString(16);
			this.$ = this.cleanDOM($);
			this.original = this.$.html();
			this.ready = true;
			this.crawler.originals.push({
				$: this.$,
				hash: this.hash
			});
		}
	}, {
		key: 'html',
		value: function html(selector) {
			return this.$(selector).html();
		}
	}, {
		key: 'getContent',
		value: function getContent() {
			var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'HTML';

			if (!Boolean(this.$('body').attr('scored'))) {
				this.scoreDOM();
			}
			var html = _extractor2.default.extractContent(this.$);
			if (type === 'PLAIN_TEXT') {
				return this.html2text(html);
			}
			if (type === 'HTML') {
				return html;
			}
			if (type === 'CLEANEVAL') {
				return this.html2cleaneval(html);
			}
		}
	}, {
		key: 'cleanDOM',
		value: function cleanDOM() {
			var $ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.$;

			$('style').remove();
			$('script').remove();
			$('link').remove();
			$('meta').remove();
			/**
    * Remove every emtpy tag except hyperlinks without children recursively
    */
			var removed = 0;
			$('*').each(function (index, element) {
				if (element.name === 'a') {
					return;
				}
				if ($(element).text().replace(/\s|\n|\t/gi, '').length === 0 && $(element).children().length === 0) {
					removed++;
					$(element).remove();
				}
			});
			if (removed === 0) {
				return $;
			} else {
				return this.cleanDOM($);
			}
		}
	}, {
		key: 'returnUrls',
		value: function returnUrls() {
			var _this = this;

			var $ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.$;

			var urls = [];
			$('a').each(function (index, element) {
				var href = $(element).attr('href');
				if (typeof href !== 'string') {
					return;
				}
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
			return _underscore2.default.unique(urls, false, function (url) {
				return url.href;
			});
		}
	}, {
		key: 'normalizeDOM',
		value: function normalizeDOM() {
			var $ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.$;

			_extractor2.default.normalizeDOM($);
		}
	}, {
		key: 'scoreNode',
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(node, otherNodes) {
				var _this2 = this;

				var site = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this;
				var sites = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.crawler.originals;
				var element, entropy, scores, lengthSites, text, i, otherText;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								element = site.$(node);

								/**
         * Score it by distance to other sites aka. entropy
         */

								entropy = 0;

								if (!this.hasEquals(site.$(node))) {
									scores = [];
									lengthSites = sites.length;
									/**
          * Test if enough sites were crawled.
          * If not use only Classifier.
          */

									if (this.crawler && this.crawler.options.readyIn <= lengthSites) {
										text = this.getOnlyText(node, site);

										for (i = 0; i < lengthSites; i++) {
											otherText = this.getOnlyText(otherNodes[i], sites[i]);

											if (site.$(otherNodes[i]).length === 0) {
												scores.push(site.$(node).text().length);
											} else {
												scores.push(_helpers2.default.getDistance(text, otherText));
											}
										}
										entropy = _helpers2.default.mean(scores) * _classifier2.default.classify(site.$(node));
									}
									entropy += _classifier2.default.classify(site.$(node));
								}
								element.attr('entropy', entropy);
								_underscore2.default.forEach(element.children(), function () {
									var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(child, index) {
										return regeneratorRuntime.wrap(function _callee2$(_context2) {
											while (1) {
												switch (_context2.prev = _context2.next) {
													case 0:
														_context2.next = 2;
														return _this2.scoreNode(site.$(child), otherNodes.map(function (e, i) {
															return sites[i].$(e.children()[index]);
														}), site, sites);

													case 2:
														entropy += _context2.sent;

													case 3:
													case 'end':
														return _context2.stop();
												}
											}
										}, _callee2, _this2);
									}));

									return function (_x10, _x11) {
										return _ref3.apply(this, arguments);
									};
								}());
								element.attr('summedEntropy', entropy);
								return _context3.abrupt('return', entropy);

							case 7:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function scoreNode(_x6, _x7) {
				return _ref2.apply(this, arguments);
			}

			return scoreNode;
		}()
	}, {
		key: 'hasEquals',
		value: function hasEquals(element) {
			var site = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;
			var sites = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.crawler.originals;

			var id = element.attr('id');
			var c = element.attr('class');
			var selector = '';
			if (id && c) {
				selector = '#' + id + '.' + c;
			} else if (id) {
				selector = '#' + id;
			} else if (c) {
				selector = '.' + c;
			} else {
				return false;
			}
			var text = element.text().replace(/\s|\n|\t/gi, '');
			var matches = 0;
			sites.forEach(function (s) {
				if (site.hash !== s.hash && matches === 0) {
					var otherText = s.$(selector).text().replace(/\s|\n|\t/gi, '');
					if (text === otherText) {
						matches++;
					}
				}
			});
			return matches > 0;
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
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
				var site = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this;
				var sites = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.crawler.originals;
				var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
				var dom, other;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								dom = site.$;

								if (!(!force && Boolean(dom('body').attr('scored')))) {
									_context4.next = 3;
									break;
								}

								return _context4.abrupt('return');

							case 3:
								/**
         * Sites with the same hash are filtered out.
         * The resulting array should contain only unique sites.
         * @type {Array.<*>}
         */
								sites = sites.filter(function (item) {
									return site.hash !== item.hash;
								});

								other = sites.map(function (site) {
									return site.$;
								});

								dom('body').attr('scored', true);
								_context4.next = 8;
								return this.scoreNode(dom('body'), other.map(function (item) {
									return item('body');
								}), site, sites);

							case 8:
								return _context4.abrupt('return', _context4.sent);

							case 9:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function scoreDOM() {
				return _ref4.apply(this, arguments);
			}

			return scoreDOM;
		}()
	}, {
		key: 'getOnlyText',
		value: function getOnlyText(node) {
			var site = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;

			var clone = site.$(node).clone();
			clone.children().remove();
			return clone.text();
		}
	}, {
		key: 'html2cleaneval',
		value: function html2cleaneval(html) {
			var tmpDOM = _cheerio2.default.load(html.replace(/\n|\t/gi, ' ').replace(/\s+/gi, ' '));
			tmpDOM('*').each(function (index, element) {
				var node = tmpDOM(element);
				if (_helpers2.default.nodeHasNoText(node)) {
					if (_helpers2.default.isEmptyNode(node)) {
						return node.remove();
					}
					return;
				}
				switch (element.name) {
					case 'li':
						node.prepend('[[l]]');
						node.append('\n\n');
						break;
					case 'p':
						node.prepend('[[p]]');
						node.append('\n\n');
						break;
					case 'h1':
						node.prepend('[[h]]');
						node.append('\n\n');
						break;
					case 'h2':
						node.prepend('[[h]]');
						node.append('\n\n');
						break;
					case 'h3':
						node.prepend('[[h]]');
						node.append('\n\n');
						break;
					case 'h4':
						node.prepend('[[h]]');
						node.append('\n\n');
						break;
					case 'h5':
						node.prepend('[[h]]');
						node.append('\n\n');
						break;
					case 'h6':
						node.prepend('[[h]]');
						node.append('\n\n');
						break;
					default:
						break;
				}
				node.append(' ');
			});
			var text = tmpDOM.text();
			return text.replace(/\[\[/gi, '<').replace(/]]/gi, '>');
		}
	}, {
		key: 'html2text',
		value: function html2text(html) {
			var tmpDOM = _cheerio2.default.load(html);
			tmpDOM('*').each(function (index, element) {
				var node = tmpDOM(element);
				switch (element.name) {
					case 'div':
						node.prepend('\n');
						node.append('\n');
						break;
					case 'ul':
						node.prepend('\n');
						node.append('\n');
						break;
					case 'ol':
						node.prepend('\n');
						node.append('\n');
						break;
					case 'li':
						node.prepend('\t');
						node.append('\n');
						break;
					case 'p':
						node.append('\n');
						break;
					case 'h1':
						node.append('\n');
						break;
					case 'h2':
						node.append('\n');
						break;
					case 'h3':
						node.append('\n');
						break;
					case 'h4':
						node.append('\n');
						break;
					case 'h5':
						node.append('\n');
						break;
					case 'h6':
						node.append('\n');
						break;
					default:
						break;
				}
				node.append(' ');
			});
			return tmpDOM.text().replace(/\s+/, ' ');
		}
	}]);

	return Site;
}();

exports.default = Site;