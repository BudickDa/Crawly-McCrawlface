import XXH from 'xxhashjs';
import URL from 'url';
import _ from 'underscore';
import Levenshtein from 'levenshtein';
import Chance from 'chance';

const chance = new Chance();

export default class Site {
	constructor(url, crawler) {
		if (crawler) {
			this.crawler = crawler;
		} else {
			console.warn('This constructor should not be called manually.')
		}
		if (url) {
			this.url = URL.parse(url);
			this.domain = URL.parse(URL.resolve(this.url.href, '/'));
		}
		this.scores = [];
		this.entropies = [];
		this.content = {};
	}

	async load() {
		if (this.url && this.crawler) {
			const $ = await this.crawler.getDOM(this.url.href);
			let text = $('body').html();
			if (!text) {
				text = '';
			}
			this.hash = XXH.h32(text, 0xABCD).toString(16);
			this.$ = this.cleanDOM($);
			return this;
		}
		return false;
	}

	html(selector) {
		return this.$(selector).html();
	}

	getContent() {
		if (this.entropies.length > 0) {
			const sumEntropy = this.entropies.reduce((a, b) => a + b, 0);
			const length = this.entropies.length;

			/**
			 * Calculate mean
			 * @type {number}
			 */
			this.mean = Math.round(sumEntropy / length);

			/**
			 * Calcualte standard deviation
			 * @type {number}
			 */
			let deviation = 0;
			this.entropies.forEach(v => {
				deviation += Math.pow(parseFloat(v) - this.mean, 2);
			});
			this.deviation = Math.sqrt(deviation / length);

			/**
			 * Normalize values
			 * @type {Array.<*>}
			 */
			this.entropies.forEach((entropy, index) => {
				this.entropies[index] = entropy - this.mean / this.deviation;
			});

			const content = [];
			const $ = this.$;

			this.traverse($('body'), function(root, args) {
				args.$(root).attr('data-entropy', parseFloat(args.$(root).attr('data-entropy')) - args.mean / args.deviation);
			}, {mean: this.mean, deviation: this.deviation, $: this.$});

			function traverse(node, mean, deviation) {
				node = $(node);
				if (parseInt(node.attr('data-entropy')) > 0) {
					content.push($(node));
				} else {
					_.forEach(node.children(), node => {
						return traverse(node, mean, deviation);
					});
				}
			}
			_.forEach($('body').children(), node => {
				return traverse(node, this.mean, this.deviation);
			});

			let html = '';
			content.forEach(e => {
				html += $(e).html() + '\n';
			});
			return html;
		}
		return '';
	}

	cleanDOM($ = this.$) {
		$('style').remove();
		$('script').remove();
		$('link').remove();
		$('meta').remove();
		//$('i').remove();
		/**
		 * Clean every emtpy tag except images
		 */
		$('*').each((index, element) => {
			$(element).attr('class', null);
			$(element).attr('id', null);
			if (element.name === 'img') {
				return;
			}
			if (element.name === 'a') {
				return;
			}
			if ($(element).text().length === 0) {
				$(element).remove()
			}
		});
		return $;
	}

	returnUrls($ = this.$) {
		const urls = [];
		$('a').each((index, element) => {
			const href = $(element).attr('href');
			if (typeof href !== 'string') {
				return;
			}
			if (href.indexOf('mailto:') !== -1) {
				return;
			}
			if (href.indexOf('.pdf') !== -1) {
				return;
			}
			const parsedUrl = URL.parse(href);
			parsedUrl.hash = null;
			if (parsedUrl.hostname !== null) {
				urls.push(parsedUrl);
			} else {
				const absoluteUrl = URL.resolve(this.domain.href, href);
				urls.push(URL.parse(absoluteUrl));
			}
		});
		return _.unique(urls, false, url => url.href);
	}


	getOnlyText(node, site = this) {
		const clone = site.$(node).clone();
		clone.children().remove();
		return clone.text();
	}

	scoreNode(node, otherNodes, site = this, sites = this.sites) {
		let score = 0;
		const lengthSites = sites.length;
		const text = this.getOnlyText(node, site);

		for (let i = 0; i < lengthSites; i++){
			let otherText = this.getOnlyText(otherNodes[i], sites[i]);
			let distance = new Levenshtein(text, otherText).distance;
			score += distance;
		}
		this.scores.push(score);
		const entropy = Math.floor(score / (text.length + 1));
		this.entropies.push(entropy);
		site.$(node).attr('data-score', score);
		site.$(node).attr('data-entropy', entropy);

		const id = site.$(node).attr('id');
		_.forEach(node.children(), (child, index) => {
			score += this.scoreNode(site.$(child), otherNodes.map((element, i) => {
				return sites[i].$(element.children()[index]);
			}), site, sites);
		});
		site.$(node).attr('data-full-score', score);
		return score;
	}

	scoreDOM(site = this, sites = this.crawler.sites) {
		sites = sites.filter(item => {
			return site.hash !== item.hash;
		});
		const dom = site.$;
		const other = sites.map(site => site.$);
		return this.scoreNode(dom('body'), other.map(item => {
			return item('body');
		}), site, sites);
	}

	traverse(root, fnc, args) {
		root = args.$(root);
		fnc(root, args);
		_.forEach(root.children(), node => {
			return this.traverse(node, fnc, args);
		});
	}
}
