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
import cheerio from 'cheerio';
import Helpers from './helpers';
import Extractor from './extractor';
import Classifier from './classifier';

class Site {
	constructor(url, crawler) {
		if (crawler) {
			this.crawler = crawler;
		} else {
			console.info('This constructor should not be called manually.')
		}
		if (url) {
			this.url = URL.parse(url);
			this.domain = URL.parse(URL.resolve(this.url.href, '/'));
		}
		this.scores = [];
		this.entropies = [];
		this.content = {};
		this.ready = false;
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
			this.original = cheerio.load(this.$).html();
			this.crawler.originals.push({
				$: this.$,
				hash: this.hash
			});
			this.ready = true;
			return this;
		}
		return false;
	}

	html(selector) {
		return this.$(selector).html();
	}

	getContent(type = 'HTML') {
		if (!Boolean(this.$('body').attr('scored'))) {
			this.scoreDOM();
		}
		const html = Extractor.extractContent(this.$);
		if (type === 'PLAIN_TEXT') {
			return this.html2text(html);
		}
		if (type === 'HTML') {
			return html;
		}

	}

	cleanDOM($ = this.$) {
		$('style').remove();
		$('script').remove();
		$('link').remove();
		$('meta').remove()
		/**
		 * Remove every emtpy tag except hyperlinks without children recursively
		 */
		let removed = 0;
		$('*').each((index, element) => {
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

	normalizeDOM($ = this.$) {
		Extractor.normalizeDOM($);
	}

	async scoreNode(node, otherNodes, site = this, sites = this.crawler.originals) {
		const element = site.$(node);

		/**
		 * Score it by distance to other sites aka. entropy
		 */
		let entropy = 0;
		if (!this.hasEquals(site.$(node))) {
			const scores = [];
			const lengthSites = sites.length;
			/**
			 * Test if enough sites were crawled.
			 * If not use only Classifier.
			 */
			if(this.crawler && this.crawler.options.readyIn <= lengthSites) {
				const text = this.getOnlyText(node, site);
				for (let i = 0; i < lengthSites; i++){
					let otherText = this.getOnlyText(otherNodes[i], sites[i]);
					if (site.$(otherNodes[i]).length === 0) {
						scores.push(site.$(node).text().length);
					} else {
						scores.push(Helpers.getDistance(text, otherText));
					}
				}
				entropy = Helpers.mean(scores) * Classifier.classify(site.$(node));
			}else{
				entropy = Classifier.classify(site.$(node));
			}
		}
		element.attr('entropy', entropy);
		_.forEach(element.children(), async (child, index) => {
			entropy += await this.scoreNode(site.$(child), otherNodes.map((e, i) => {
				return sites[i].$(e.children()[index]);
			}), site, sites);
		});
		element.attr('summedEntropy', entropy);
		return entropy;
	}

	hasEquals(element, site = this, sites = this.crawler.originals) {
		const id = element.attr('id');
		const c = element.attr('class');
		let selector = '';
		if (id && c) {
			selector = `#${id}.${c}`;
		} else if (id) {
			selector = `#${id}`;
		} else if (c) {
			selector = `.${c}`;
		} else {
			return false;
		}
		const text = element.text().replace(/\s|\n|\t/gi, '');
		let matches = 0;
		sites.forEach(s => {
			if (site.hash !== s.hash && matches === 0) {
				let otherText = s.$(selector).text().replace(/\s|\n|\t/gi, '');
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
	async scoreDOM(site = this, sites = this.crawler.originals, force = false) {
		const dom = site.$;
		if (!force && Boolean(dom('body').attr('scored'))) {
			/*
			 DOM has already been scored. For repeated scoring call scoreDOM with paramter force set true
			 */
			return;
		}
		/**
		 * Sites with the same hash are filtered out.
		 * The resulting array should contain only unique sites.
		 * @type {Array.<*>}
		 */
		sites = sites.filter(item => {
			return site.hash !== item.hash;
		});

		const other = sites.map(site => site.$);
		dom('body').attr('scored', true);
		return await this.scoreNode(dom('body'), other.map(item => {
			return item('body');
		}), site, sites);
	}

	/**
	 * Evaluates ankers
	 * The worth of an anker is in relation to the context.
	 * An anker within a text is probably part of this text, thus it is part of the content.
	 *
	 * To compute the core we use the text density (length of text / count of children) and
	 * the length of the context - the length of all link text in parent.
	 * @param element
	 */
	scoreHyperlink(element, site = this, sites = this.crawler.originals) {
		if (element.text().length === 0) {
			return 0;
		}
		const $ = this.$;
		const parent = element.parent();
		const context = parent.text();

		/*
		 let linkTextLength = context.length;
		 $(parent).find('a').each((index, element) => {
		 linkTextLength -= $(element).text().length;
		 });
		 if (linkTextLength === 0) {
		 return 0;
		 }
		 */

		/**
		 * Check if this linktext and url combination exists on other sites
		 */
		let count = 0;
		sites.forEach(site => {
			if (site.hash !== this.hash) {
				site.$('a').each((i, el) => {
					const otherElement = site.$(el);
					if (element.text() === otherElement.text() && element.attr('href') === otherElement.attr('href')) {
						count++;
					}
				});
			}
		});
		const score = count / (sites.length + 1) * 100;
		if (score > 30) {
			return 0;
		}

		return Site.getTextDensity(parent) + linkTextLength;
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
