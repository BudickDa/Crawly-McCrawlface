'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _url2 = require('url');

var _url3 = _interopRequireDefault(_url2);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _site = require('./site');

var _site2 = _interopRequireDefault(_site);

var _levenshtein = require('levenshtein');

var _levenshtein2 = _interopRequireDefault(_levenshtein);

var _googleNlpApi = require('google-nlp-api');

var _googleNlpApi2 = _interopRequireDefault(_googleNlpApi);

var _translate = require('@google-cloud/translate');

var _translate2 = _interopRequireDefault(_translate);

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _sitemapper = require('sitemapper');

var _sitemapper2 = _interopRequireDefault(_sitemapper);

var _robotsParser = require('robots-parser');

var _robotsParser2 = _interopRequireDefault(_robotsParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
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

var Crawler = function (_EventEmitter) {
	_inherits(Crawler, _EventEmitter);

	function Crawler(seed, options) {
		_classCallCheck(this, Crawler);

		var _this = _possibleConstructorReturn(this, (Crawler.__proto__ || Object.getPrototypeOf(Crawler)).call(this));

		_this.reset();
		_events2.default.call(_this);
		_this.queue = [];

		if (options) {
			_this.options = options;
		} else {
			_this.options = {
				readyIn: 50,
				goHaywire: false,
				userAgent: 'CrawlyMcCrawlface',
				expireDefault: 7 * 24 * 60 * 60 * 1000
			};
		}

		_this.originals = [];
		_this.sites = [];
		_this.crawled = [];
		_this.expiries = {};
		_this.filters = [];

		_this.ready = _this.init(seed);
		return _this;
	}

	_createClass(Crawler, [{
		key: 'init',
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(seed) {
				var urls, i, url, domain, _i, _url;

				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								if (Array.isArray(seed)) {
									this.queue = seed.map(function (url) {
										return _url3.default.parse(url);
									});
								} else if (typeof seed === 'string') {
									this.queue.push(_url3.default.parse(seed));
								}
								urls = _underscore2.default.unique(this.queue.map(function (url) {
									return _url3.default.parse(_url3.default.resolve(url.href, '/'));
								}));

								this.domains = [];
								_context.t0 = regeneratorRuntime.keys(urls);

							case 4:
								if ((_context.t1 = _context.t0()).done) {
									_context.next = 15;
									break;
								}

								i = _context.t1.value;
								url = urls[i];
								_context.t2 = url.hostname;
								_context.next = 10;
								return this.getRobot(url);

							case 10:
								_context.t3 = _context.sent;
								domain = {
									hostname: _context.t2,
									robot: _context.t3
								};

								this.domains.push(domain);
								_context.next = 4;
								break;

							case 15:
								/**
         * This must be in an extra loop because getSitemap calls addToQueue which uses this.domains
         */
								for (_i in urls) {
									_url = urls[_i];

									this.getSitemap(_url);
								}
								return _context.abrupt('return', true);

							case 17:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function init(_x) {
				return _ref.apply(this, arguments);
			}

			return init;
		}()
	}, {
		key: 'each',
		value: function each(cb) {
			_underscore2.default.forEach(this.sites, cb);
		}
	}, {
		key: 'eachHTML',
		value: function eachHTML(cb) {
			_underscore2.default.forEach(this.sites, function (site) {
				cb(site.getContent('HTML'));
			});
		}
	}, {
		key: 'eachText',
		value: function eachText(cb) {
			_underscore2.default.forEach(this.sites, function (site) {
				cb(site.getContent('PLAIN_TEXT'));
			});
		}
	}, {
		key: 'start',
		value: function start() {
			this.workQueue(this, false);
		}
	}, {
		key: 'getSitemap',
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(url) {
				var _this2 = this;

				var sitemap, result;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								sitemap = new _sitemapper2.default();
								_context2.prev = 1;
								_context2.next = 4;
								return sitemap.fetch(url.resolve('/sitemap.xml'));

							case 4:
								result = _context2.sent;

								_underscore2.default.forEach(result.sites, function (site) {
									_this2.addToQueue(site);
								});
								_context2.next = 11;
								break;

							case 8:
								_context2.prev = 8;
								_context2.t0 = _context2['catch'](1);

								console.log(_context2.t0);

							case 11:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this, [[1, 8]]);
			}));

			function getSitemap(_x2) {
				return _ref2.apply(this, arguments);
			}

			return getSitemap;
		}()
	}, {
		key: 'getRobot',
		value: function () {
			var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(url) {
				var response;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								_context3.prev = 0;
								_context3.next = 3;
								return this.fetch(url.resolve('/robots.txt'));

							case 3:
								response = _context3.sent;
								return _context3.abrupt('return', (0, _robotsParser2.default)(url.resolve('/robots.txt'), response));

							case 7:
								_context3.prev = 7;
								_context3.t0 = _context3['catch'](0);
								return _context3.abrupt('return', (0, _robotsParser2.default)(url.resolve('/robots.txt'), ''));

							case 10:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, this, [[0, 7]]);
			}));

			function getRobot(_x3) {
				return _ref3.apply(this, arguments);
			}

			return getRobot;
		}()

		/**
   * Adds a filter.
   * If filters are set only sites that have a url that pass a match with at least one of the filters are added to the queue.
   * Other sites, except those in the seed, are ignored.
   * @param filter (string|RegExp)
   */

	}, {
		key: 'addFilter',
		value: function addFilter(filter) {
			/**
    * Only regex or string allowed.
    */
			if (!(filter instanceof RegExp || typeof filter === 'string')) {
				throw new TypeError('addFilter expects Regex or string as parameter');
			}
			/**
    * Prevents filters from beeing doubled.
    */
			if (!_underscore2.default.contains(this.filters, filter)) {
				this.filters.push(filter);
			}
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.state = {
				finished: false,
				ready: false,
				stopped: false,
				working: []
			};
		}
	}, {
		key: 'getByUrl',
		value: function getByUrl(url) {
			if (this.sites.length === 0) {
				return;
			}
			var index = -1;
			var distance = url.length / 2;
			this.sites.forEach(function (site, i) {
				var tmp = new _levenshtein2.default(site.url.href, url).distance;
				if (tmp < distance) {
					distance = tmp;
					index = i;
				}
			});
			if (index === -1) {
				return;
			}
			return this.sites[index];
		}
	}, {
		key: 'addCache',
		value: function addCache(cache) {
			this.cache = cache;
		}
	}, {
		key: 'workQueue',
		value: function workQueue() {
			var crawler = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this;
			var recursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			if (!recursive) {
				crawler.reset();
			}

			if (crawler.queue.length > 0 && !crawler.state.stopped) {
				var url = _underscore2.default.first(crawler.queue);
				crawler.crawled.push(url.href);
				crawler.queue.shift();
				var site = new _site2.default(url.href, crawler);
				var promise = crawler.workSite(site, crawler);
				if (recursive) {
					return crawler.workQueue(crawler, true);
				}
				promise.then(function () {
					crawler.workQueue(crawler, true);
				}).catch(function (e) {
					throw e;
				});
			}
		}

		/**
   * If a site is worked it is registered in this.state.working.
   * If this array has length of 0, no site is currently worked.
   * @returns {boolean}
   */

	}, {
		key: 'isWorking',
		value: function isWorking() {
			return this.state.working.length !== 0;
		}

		/**
   * Registers the site the function currently works on in state.
   * @param site
   */

	}, {
		key: 'working',
		value: function working(site) {
			var url = site.url.href;
			this.state.working.push(url);
		}

		/**
   * Call when site is worked to remove it from this.state.working array
   * @param site
   */

	}, {
		key: 'worked',
		value: function worked(site) {
			var url = site.url.href;
			var index = this.state.working.indexOf(url);
			if (index > -1) {
				this.state.working.splice(index, 1);
			}
		}
	}, {
		key: 'workSite',
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(site, crawler) {
				var _this3 = this;

				var urls, queueEmpty, minimalSitesCrawled;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								_context4.next = 2;
								return this.ready;

							case 2:
								crawler.working(site);
								_context4.prev = 3;
								_context4.next = 6;
								return site.load();

							case 6:
								_context4.next = 12;
								break;

							case 8:
								_context4.prev = 8;
								_context4.t0 = _context4['catch'](3);

								console.log(_context4.t0);
								this.emit('error', _context4.t0);

							case 12:
								_context4.prev = 12;

								crawler.worked(site);
								return _context4.finish(12);

							case 15:
								urls = site.returnUrls();


								urls.forEach(function (url) {
									_this3.addToQueue(url);
								});
								crawler.sites.push(site);
								this.emit('siteAdded', site);
								this.emit('sitesChanged', crawler.sites.length);

								queueEmpty = crawler.queue.length === 0 && !crawler.isWorking();
								minimalSitesCrawled = crawler.sites.length >= crawler.options.readyIn;

								if ((queueEmpty || minimalSitesCrawled) && !crawler.state.ready) {
									crawler.state.ready = true;
									this.emit('ready', this);
								}
								if ((crawler.queue.length === 0 || crawler.state.stopped) && !crawler.finished && !crawler.isWorking()) {
									crawler.state.finished = true;
									this.emit('finished', this);
									crawler.stop();
								}

							case 24:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, this, [[3, 8, 12, 15]]);
			}));

			function workSite(_x6, _x7) {
				return _ref4.apply(this, arguments);
			}

			return workSite;
		}()
	}, {
		key: 'addToQueue',
		value: function addToQueue(url) {
			var crawler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;

			if (!url) {
				return;
			}
			if (typeof url === 'string') {
				url = _url3.default.parse(url);
			}
			/**
    * Filter the returned urls with this.filters
    */
			var href = url.href;
			/**
    * If not filters are added, nothing is filtered, every sites passes
    */
			var match = this.filters.length === 0;

			/**
    * Test every filter and concat them with OR.
    * todo: let user decide between OR and AND
    * todo: maybe let user decide between whitelist and blacklist
    */
			crawler.filters.forEach(function (filter) {
				match = match || Boolean(href.match(filter));
			});

			var domain = _underscore2.default.find(crawler.domains, function (domain) {
				return domain.hostname === url.hostname;
			});

			if (!match) {
				return;
			}

			if (!(domain && domain.robot.isAllowed(url.href, crawler.options.userAgent))) {
				return;
			}

			if (!crawler.alreadyCrawled(url.href)) {
				return;
			}

			crawler.queue.push(url);
		}
	}, {
		key: 'alreadyCrawled',
		value: function alreadyCrawled(href) {
			var inSite = _underscore2.default.contains(this.sites, function (site) {
				return site.url.href === href;
			});
			return this.crawled.indexOf(href) === -1 && this.queue.indexOf(href) === -1 && !inSite;
		}
	}, {
		key: 'getContent',
		value: function getContent(url) {
			var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'PLAIN_TEXT';

			var site = this.getByUrl(url);
			if (!site) {
				throw new Error(404, 'Site not found');
			}
			site.scoreDOM();
			return site.getContent(type);
		}
	}, {
		key: 'getJSON',
		value: function getJSON(url) {
			var site = this.getByUrl(url);
			if (!site) {
				throw new Error(404, 'Site not found');
			}
			site.scoreDOM();
			return {
				html: site.getContent('HTML'),
				text: site.getContent('PLAIN_TEXT')
			};
		}

		/**
   * Gets the html from an url and creates a DOM with the help of cheerio.
   * It checks first if there is a cache, if yes it tries the cache for the domain first.
   * If there is nothing in the cache, it uses the fetch method to load the html from the internet
   * @param url
   * @returns {Promise.<*>}
   */

	}, {
		key: 'getDOM',
		value: function () {
			var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(url) {
				var response, data, d, expire;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								response = void 0;

								if (!this.cache) {
									_context5.next = 24;
									break;
								}

								_context5.prev = 2;
								data = this.cache.get(url);
								/**
         * Check if data is a promise.
         * There are a lot of polyfills for promise out there, so we should not only check for instance of promise
         * but also simlpy if it has a then method.
         */

								if (!(data && (data instanceof Promise || typeof data.then === 'function'))) {
									_context5.next = 12;
									break;
								}

								_context5.next = 7;
								return data;

							case 7:
								d = _context5.sent;

								if (!d) {
									_context5.next = 10;
									break;
								}

								return _context5.abrupt('return', _cheerio2.default.load(d));

							case 10:
								_context5.next = 18;
								break;

							case 12:
								if (!(data && typeof data === 'string')) {
									_context5.next = 16;
									break;
								}

								return _context5.abrupt('return', _cheerio2.default.load(data));

							case 16:
								if (!data) {
									_context5.next = 18;
									break;
								}

								throw new TypeError('get method of cache returns ' + (typeof data === 'undefined' ? 'undefined' : _typeof(data)) + '. But it should be a Promise or a string. Content of data: ' + data);

							case 18:
								_context5.next = 24;
								break;

							case 20:
								_context5.prev = 20;
								_context5.t0 = _context5['catch'](2);

								console.error(_context5.t0);
								throw _context5.t0;

							case 24:
								_context5.prev = 24;
								_context5.t1 = this;
								_context5.next = 28;
								return this.fetch(url);

							case 28:
								_context5.t2 = _context5.sent;
								response = _context5.t1.clean.call(_context5.t1, _context5.t2);
								_context5.next = 36;
								break;

							case 32:
								_context5.prev = 32;
								_context5.t3 = _context5['catch'](24);

								console.error(_context5.t3);
								throw _context5.t3;

							case 36:
								if (this.cache) {
									expire = this.options.expireDefault;

									if (this.expiries[url]) {
										expire = this.expiries[url];
									}
									this.cache.set(url, response, expire);
								}
								return _context5.abrupt('return', _cheerio2.default.load(response));

							case 38:
							case 'end':
								return _context5.stop();
						}
					}
				}, _callee5, this, [[2, 20], [24, 32]]);
			}));

			function getDOM(_x10) {
				return _ref5.apply(this, arguments);
			}

			return getDOM;
		}()
	}, {
		key: 'clean',
		value: function clean(string) {
			return string.replace(/\t/gi, ' ').replace(/\s+/, ' ').replace(/<!--(.*?)-->/gi, '');
		}

		/**
   * Returns data extracted with the Google NLP API
   * @param url
   * @param features
   * @param type
   * @param encoding
   * @returns {Promise.<*>}
   */

	}, {
		key: 'getData',
		value: function () {
			var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(url) {
				var features = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
					extractSyntax: true,
					extractEntities: true,
					extractDocumentSentiment: false
				};
				var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'PLAIN_TEXT';
				var encoding = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'UTF8';
				var text, language, nlp, translation;
				return regeneratorRuntime.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								text = this.getContent(url, type);
								_context6.next = 3;
								return Crawler.getLanguage(text).then(language);

							case 3:
								language = _context6.sent;
								nlp = new _googleNlpApi2.default();

								if (!(language === 'en')) {
									_context6.next = 9;
									break;
								}

								_context6.next = 8;
								return nlp.annotateText(text, type, encoding, features);

							case 8:
								return _context6.abrupt('return', _context6.sent);

							case 9:
								_context6.next = 11;
								return Crawler.getTranslation(text);

							case 11:
								translation = _context6.sent;
								_context6.next = 14;
								return nlp.annotateText(translation, type, encoding, features);

							case 14:
								return _context6.abrupt('return', _context6.sent);

							case 15:
							case 'end':
								return _context6.stop();
						}
					}
				}, _callee6, this);
			}));

			function getData(_x11) {
				return _ref6.apply(this, arguments);
			}

			return getData;
		}()
	}, {
		key: 'fetch',
		value: function fetch(url) {
			return new Promise(function (resolve, reject) {
				_request2.default.get(url, function (err, response, body) {
					if (err) {
						reject(err);
					}
					resolve(body);
				});
			});
		}
	}, {
		key: 'stop',
		value: function stop() {
			this.state.stopped = true;
		}
	}, {
		key: 'setCache',
		value: function setCache(cache) {
			if (typeof cache.get !== 'function' || typeof cache.set !== 'function') {
				throw new TypeError('This is not a valid cache. It needs a set and a get function.');
			}
			this.cache = cache;
		}
	}], [{
		key: 'getTranslation',
		value: function () {
			var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(text) {
				var translate, results;
				return regeneratorRuntime.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								if (_process2.default.env.GOOGLE_TRANSLATE_API) {
									_context7.next = 2;
									break;
								}

								throw new Error('Please set key for Google Translate API');

							case 2:
								translate = (0, _translate2.default)({ key: _process2.default.env.GOOGLE_TRANSLATE_API });
								_context7.next = 5;
								return translate.translate(text, 'en');

							case 5:
								results = _context7.sent;
								return _context7.abrupt('return', results[0]);

							case 7:
							case 'end':
								return _context7.stop();
						}
					}
				}, _callee7, this);
			}));

			function getTranslation(_x15) {
				return _ref7.apply(this, arguments);
			}

			return getTranslation;
		}()
	}, {
		key: 'getLanguage',
		value: function () {
			var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(text) {
				var translate, results, detection;
				return regeneratorRuntime.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								if (_process2.default.env.GOOGLE_TRANSLATE_API) {
									_context8.next = 2;
									break;
								}

								throw new Error('Please set key for Google Translate API');

							case 2:
								translate = (0, _translate2.default)({ key: _process2.default.env.GOOGLE_TRANSLATE_API });
								_context8.next = 5;
								return translate.detect(text);

							case 5:
								results = _context8.sent;
								detection = results[0];
								return _context8.abrupt('return', detection.language);

							case 8:
							case 'end':
								return _context8.stop();
						}
					}
				}, _callee8, this);
			}));

			function getLanguage(_x16) {
				return _ref8.apply(this, arguments);
			}

			return getLanguage;
		}()
	}]);

	return Crawler;
}(_events2.default);

exports.default = Crawler;