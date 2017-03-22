/**
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

import XXH from 'xxhashjs';
import URL from 'url';
import _ from 'underscore';
import Levenshtein from 'levenshtein';
import Chance from 'chance';
import cheerio from 'cheerio';

const chance = new Chance();

class Site {
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

	getContent(type = 'HTML') {
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

			const content = [];
			const $ = this.$;

			this.traverse($('body'), function(root, args) {
				/**
				 * Normalize entropy
				 */
				args.$(root).attr('data-entropy', parseFloat(args.$(root).attr('data-entropy')) - args.mean / args.deviation);
			}, {mean: this.mean, deviation: this.deviation, $: this.$});

			const title = $('title').text();
			const extractedDom = cheerio.load(`<html><head><title>${title}</title></head><body></body></html>`);

			$('[data-entropy]').each((index, node) => {
				const element = $(node);
				if (element.children().length === 0 && parseFloat(element.data('entropy')) < 0 || element.text().length === 0) {
						$(node).remove();
				}
			});

			function traverse(node, mean, deviation) {
				node = $(node);
				if (parseFloat(node.data('entropy')) > 0) {
					const tag = node.prop('tagName');
					extractedDom('body').append(`<${tag}>${node.html()}</${tag}>`);
				} else {
					_.forEach(node.children(), function(node) {
						return traverse(node, mean, deviation);
					});
				}
			}

			_.forEach($('body').children(), node => {
				traverse(node, this.mean, this.deviation);
			});


			const html = extractedDom.html();

			if (type === 'PLAIN_TEXT') {
				return this.html2text(html);
			}
			if (type === 'HTML') {
				return html;
			}
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

	getOnlyText(node, site = this) {
		const clone = site.$(node).clone();
		clone.children().remove();
		return clone.text();
	}

	html2text(html) {
		const tmpDOM = cheerio.load(html);
		tmpDOM('*').each((index, element) => {
			const node = tmpDOM(element);
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
}
export {Site as default};
