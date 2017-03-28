'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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
		if (Array.isArray(seed)) {
			_this.queue = seed.map(function (url) {
				return _url2.default.parse(url);
			});
		} else if (typeof seed === 'string') {
			_this.queue.push(_url2.default.parse(seed));
		}
		_this.domains = _underscore2.default.unique(_this.queue.map(function (url) {
			return _url2.default.parse(_url2.default.resolve(url.href, '/')).hostname;
		}));

		if (options) {
			_this.options = options;
		} else {
			_this.options = {
				readyIn: 50,
				goHaywire: false
			};
		}

		_this.originals = [];
		_this.sites = [];
		_this.crawled = [];
		return _this;
	}

	_createClass(Crawler, [{
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
					console.error(e);
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
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(site, crawler) {
				var urls, queueEmpty, minimalSitesCrawled;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								crawler.working(site);
								_context.prev = 1;
								_context.next = 4;
								return site.load();

							case 4:
								_context.next = 10;
								break;

							case 6:
								_context.prev = 6;
								_context.t0 = _context['catch'](1);

								console.log(_context.t0);
								this.emit('error', _context.t0);

							case 10:
								_context.prev = 10;

								crawler.worked(site);
								return _context.finish(10);

							case 13:
								urls = site.returnUrls();

								urls.forEach(function (url) {
									if (crawler.crawled.indexOf(url.href) === -1 && crawler.domains.indexOf(url.hostname) !== -1) {
										crawler.queue.push(url);
									}
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

							case 22:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this, [[1, 6, 10, 13]]);
			}));

			function workSite(_x3, _x4) {
				return _ref.apply(this, arguments);
			}

			return workSite;
		}()
	}, {
		key: 'getContent',
		value: function getContent(url) {
			var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'PLAIN_TEXT';

			var site = this.getByUrl(url);
			site.scoreDOM();
			return site.getContent(type);
		}
	}, {
		key: 'getDOM',
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(url) {
				var response, data;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								response = void 0;

								if (!this.cache) {
									_context2.next = 14;
									break;
								}

								_context2.prev = 2;
								_context2.next = 5;
								return this.cache.get(url);

							case 5:
								data = _context2.sent;

								if (!data) {
									_context2.next = 8;
									break;
								}

								return _context2.abrupt('return', _cheerio2.default.load(data));

							case 8:
								_context2.next = 14;
								break;

							case 10:
								_context2.prev = 10;
								_context2.t0 = _context2['catch'](2);

								console.error(_context2.t0);
								throw _context2.t0;

							case 14:
								_context2.prev = 14;
								_context2.next = 17;
								return this.fetch(url);

							case 17:
								response = _context2.sent;
								_context2.next = 24;
								break;

							case 20:
								_context2.prev = 20;
								_context2.t1 = _context2['catch'](14);

								console.error(_context2.t1);
								throw _context2.t1;

							case 24:
								if (this.cache) {
									this.cache.set(url, response);
								}
								return _context2.abrupt('return', _cheerio2.default.load(response));

							case 26:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this, [[2, 10], [14, 20]]);
			}));

			function getDOM(_x6) {
				return _ref2.apply(this, arguments);
			}

			return getDOM;
		}()

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
			var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(url) {
				var features = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
					extractSyntax: true,
					extractEntities: true,
					extractDocumentSentiment: false
				};
				var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'PLAIN_TEXT';
				var encoding = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'UTF8';
				var text, language, nlp, translation;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								text = this.getContent(url, type);
								_context3.next = 3;
								return Crawler.getLanguage(text).then(language);

							case 3:
								language = _context3.sent;
								nlp = new _googleNlpApi2.default();

								if (!(language === 'en')) {
									_context3.next = 9;
									break;
								}

								_context3.next = 8;
								return nlp.annotateText(text, type, encoding, features);

							case 8:
								return _context3.abrupt('return', _context3.sent);

							case 9:
								_context3.next = 11;
								return Crawler.getTranslation(text);

							case 11:
								translation = _context3.sent;
								_context3.next = 14;
								return nlp.annotateText(translation, type, encoding, features);

							case 14:
								return _context3.abrupt('return', _context3.sent);

							case 15:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function getData(_x7) {
				return _ref3.apply(this, arguments);
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
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(text) {
				var translate, results;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								if (_process2.default.env.GOOGLE_TRANSLATE_API) {
									_context4.next = 2;
									break;
								}

								throw new Error('Please set key for Google Translate API');

							case 2:
								translate = (0, _translate2.default)({ key: _process2.default.env.GOOGLE_TRANSLATE_API });
								_context4.next = 5;
								return translate.translate(text, 'en');

							case 5:
								results = _context4.sent;
								return _context4.abrupt('return', results[0]);

							case 7:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function getTranslation(_x11) {
				return _ref4.apply(this, arguments);
			}

			return getTranslation;
		}()
	}, {
		key: 'getLanguage',
		value: function () {
			var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(text) {
				var translate, results, detection;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								if (_process2.default.env.GOOGLE_TRANSLATE_API) {
									_context5.next = 2;
									break;
								}

								throw new Error('Please set key for Google Translate API');

							case 2:
								translate = (0, _translate2.default)({ key: _process2.default.env.GOOGLE_TRANSLATE_API });
								_context5.next = 5;
								return translate.detect(text);

							case 5:
								results = _context5.sent;
								detection = results[0];
								return _context5.abrupt('return', detection.language);

							case 8:
							case 'end':
								return _context5.stop();
						}
					}
				}, _callee5, this);
			}));

			function getLanguage(_x12) {
				return _ref5.apply(this, arguments);
			}

			return getLanguage;
		}()
	}]);

	return Crawler;
}(_events2.default);

exports.default = Crawler;