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

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _googleNlpApi = require('google-nlp-api');

var _googleNlpApi2 = _interopRequireDefault(_googleNlpApi);

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

var nlp = new _googleNlpApi2.default();
var chance = new _chance2.default();

var Crawly = function (_EventEmitter) {
	_inherits(Crawly, _EventEmitter);

	function Crawly(seed, options) {
		_classCallCheck(this, Crawly);

		var _this = _possibleConstructorReturn(this, (Crawly.__proto__ || Object.getPrototypeOf(Crawly)).call(this));

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
				readyIn: 15,
				goHaywire: false
			};
		}

		_this.sites = [];
		_this.crawled = [];

		_this.stopped = false;
		return _this;
	}

	_createClass(Crawly, [{
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
			var _this2 = this;

			var crawler = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this;

			if (crawler.queue.length > 0) {
				var url = _underscore2.default.first(crawler.queue);
				crawler.crawled.push(url.href);
				crawler.queue.shift();
				var site = new _site2.default(url.href, crawler);
				site.load().then(function (site) {
					return crawler.workSite(site, crawler);
				}).catch(function (e) {
					_this2.emit('error', e);
				});
			}
		}
	}, {
		key: 'workSite',
		value: function workSite(site, crawler) {
			var urls = site.returnUrls();
			urls.forEach(function (url) {
				if (crawler.crawled.indexOf(url.href) === -1 && (crawler.goCrazy || crawler.domains.indexOf(url.hostname) !== -1)) {
					crawler.queue.push(url);
				}
			});
			crawler.sites.push(site);
			this.emit('siteAdded', site);
			this.emit('sitesChanged', crawler.sites.length);
			if (crawler.sites.length >= this.options.readyIn) {
				this.emit('ready');
			}
			if (crawler.queue.length === 0 || this.stopped) {
				this.stopped = false;
				this.emit('finished');
			} else {
				crawler.workQueue(crawler);
			}
		}
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
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(url) {
				var response, data;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								response = void 0;

								if (!this.cache) {
									_context.next = 14;
									break;
								}

								_context.prev = 2;
								_context.next = 5;
								return this.cache.get(url);

							case 5:
								data = _context.sent;

								if (!data) {
									_context.next = 8;
									break;
								}

								return _context.abrupt('return', _cheerio2.default.load(data));

							case 8:
								_context.next = 14;
								break;

							case 10:
								_context.prev = 10;
								_context.t0 = _context['catch'](2);

								console.error(_context.t0);
								throw _context.t0;

							case 14:
								_context.prev = 14;
								_context.next = 17;
								return this.fetch(url);

							case 17:
								response = _context.sent;
								_context.next = 24;
								break;

							case 20:
								_context.prev = 20;
								_context.t1 = _context['catch'](14);

								console.error(_context.t1);
								throw _context.t1;

							case 24:
								if (this.cache) {
									this.cache.set(url, response);
								}
								return _context.abrupt('return', _cheerio2.default.load(response));

							case 26:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this, [[2, 10], [14, 20]]);
			}));

			function getDOM(_x3) {
				return _ref.apply(this, arguments);
			}

			return getDOM;
		}()
	}, {
		key: 'getData',
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(url) {
				var text, data;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								if (_process2.default.env.GOOGLE_NLP_API) {
									_context2.next = 2;
									break;
								}

								throw new Error('Please supply Google NLP API key as environment variable googleNlpApi');

							case 2:
								text = this.getContent(url, 'HTML');
								_context2.next = 5;
								return nlp.annotateText(text, 'HTML');

							case 5:
								data = _context2.sent;
								return _context2.abrupt('return', data);

							case 7:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function getData(_x4) {
				return _ref2.apply(this, arguments);
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
			this.stopped = true;
		}
	}, {
		key: 'setCache',
		value: function setCache(cache) {
			if (typeof cache.get !== 'function' || typeof cache.set !== 'function') {
				throw new TypeError('This is not a valid cache. It needs a set and a get function.');
			}
			this.cache = cache;
		}
	}]);

	return Crawly;
}(_events2.default);

exports.default = Crawly;