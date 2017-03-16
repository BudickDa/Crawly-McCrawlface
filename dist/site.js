'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _xxhashjs = require('xxhashjs');

var _xxhashjs2 = _interopRequireDefault(_xxhashjs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _levenshtein = require('levenshtein');

var _levenshtein2 = _interopRequireDefault(_levenshtein);

var _chance = require('chance');

var _chance2 = _interopRequireDefault(_chance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var chance = new _chance2.default();

var Site = function () {
	function Site(url, crawler) {
		_classCallCheck(this, Site);

		if (crawler) {
			this.crawler = crawler;
		} else {
			console.warn('This constructor should not be called manually.');
		}
		if (url) {
			this.url = _url2.default.parse(url);
			this.domain = _url2.default.parse(_url2.default.resolve(this.url.href, '/'));
		}
		this.scores = [];
		this.entropies = [];
		this.content = {};
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
									_context.next = 9;
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
								return _context.abrupt('return', this);

							case 9:
								return _context.abrupt('return', false);

							case 10:
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
		key: 'html',
		value: function html(selector) {
			return this.$(selector).html();
		}
	}, {
		key: 'getContent',
		value: function getContent() {
			var _this = this;

			if (this.entropies.length > 0) {
				var _traverse = function _traverse(node, mean, deviation) {
					node = $(node);
					if (parseInt(node.attr('data-entropy')) > 0) {
						content.push($(node));
					} else {
						_underscore2.default.forEach(node.children(), function (node) {
							return _traverse(node, mean, deviation);
						});
					}
				};

				var sumEntropy = this.entropies.reduce(function (a, b) {
					return a + b;
				}, 0);
				var length = this.entropies.length;

				/**
     * Calculate mean
     * @type {number}
     */
				this.mean = Math.round(sumEntropy / length);

				/**
     * Calcualte standard deviation
     * @type {number}
     */
				var deviation = 0;
				this.entropies.forEach(function (v) {
					deviation += Math.pow(parseFloat(v) - _this.mean, 2);
				});
				this.deviation = Math.sqrt(deviation / length);

				/**
     * Normalize values
     * @type {Array.<*>}
     */
				this.entropies.forEach(function (entropy, index) {
					_this.entropies[index] = entropy - _this.mean / _this.deviation;
				});

				var content = [];
				var $ = this.$;

				this.traverse($('body'), function (root, args) {
					args.$(root).attr('data-entropy', parseFloat(args.$(root).attr('data-entropy')) - args.mean / args.deviation);
				}, { mean: this.mean, deviation: this.deviation, $: this.$ });

				_underscore2.default.forEach($('body').children(), function (node) {
					return _traverse(node, _this.mean, _this.deviation);
				});

				var html = '';
				content.forEach(function (e) {
					html += $(e).html() + '\n';
				});
				return html;
			}
			return '';
		}
	}, {
		key: 'cleanDOM',
		value: function cleanDOM() {
			var $ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.$;

			$('style').remove();
			$('script').remove();
			$('link').remove();
			$('meta').remove();
			//$('i').remove();
			/**
    * Clean every emtpy tag except images
    */
			$('*').each(function (index, element) {
				$(element).attr('class', null);
				$(element).attr('id', null);
				if (element.name === 'img') {
					return;
				}
				if (element.name === 'a') {
					return;
				}
				if ($(element).text().length === 0) {
					$(element).remove();
				}
			});
			return $;
		}
	}, {
		key: 'returnUrls',
		value: function returnUrls() {
			var _this2 = this;

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
					var absoluteUrl = _url2.default.resolve(_this2.domain.href, href);
					urls.push(_url2.default.parse(absoluteUrl));
				}
			});
			return _underscore2.default.unique(urls, false, function (url) {
				return url.href;
			});
		}
	}, {
		key: 'getOnlyText',
		value: function getOnlyText(node) {
			var site = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;

			var clone = site.$(node).clone();
			clone.children().remove();
			return clone.text();
		}
	}, {
		key: 'scoreNode',
		value: function scoreNode(node, otherNodes) {
			var _this3 = this;

			var site = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this;
			var sites = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.sites;

			var score = 0;
			var lengthSites = sites.length;
			var text = this.getOnlyText(node, site);

			for (var i = 0; i < lengthSites; i++) {
				var otherText = this.getOnlyText(otherNodes[i], sites[i]);
				var distance = new _levenshtein2.default(text, otherText).distance;
				score += distance;
			}
			this.scores.push(score);
			var entropy = Math.floor(score / (text.length + 1));
			this.entropies.push(entropy);
			site.$(node).attr('data-score', score);
			site.$(node).attr('data-entropy', entropy);

			var id = site.$(node).attr('id');
			_underscore2.default.forEach(node.children(), function (child, index) {
				score += _this3.scoreNode(site.$(child), otherNodes.map(function (element, i) {
					return sites[i].$(element.children()[index]);
				}), site, sites);
			});
			site.$(node).attr('data-full-score', score);
			return score;
		}
	}, {
		key: 'scoreDOM',
		value: function scoreDOM() {
			var site = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this;
			var sites = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.crawler.sites;

			sites = sites.filter(function (item) {
				return site.hash !== item.hash;
			});
			var dom = site.$;
			var other = sites.map(function (site) {
				return site.$;
			});
			return this.scoreNode(dom('body'), other.map(function (item) {
				return item('body');
			}), site, sites);
		}
	}, {
		key: 'traverse',
		value: function traverse(root, fnc, args) {
			var _this4 = this;

			root = args.$(root);
			fnc(root, args);
			_underscore2.default.forEach(root.children(), function (node) {
				return _this4.traverse(node, fnc, args);
			});
		}
	}]);

	return Site;
}();

exports.default = Site;