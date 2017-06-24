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

import URL from 'url';
import _ from 'lodash';
import FckffDOM from 'fckffdom';
import Helpers from 'my-helpers';
import leven from 'leven';
import Classifier from './classifier';

class Site {
	constructor(url, crawler) {
		if (crawler) {
			this.crawler = crawler;
		} else {
			//console.info('This constructor should not be called manually.')
		}
		if (url) {
			this.url = URL.parse(url);
			this.domain = URL.parse(URL.resolve(this.url.href, '/'));
		}
		this.ready = false;
		this.scored = false;
		this.entropies = [];
	}

	async load() {
		if (this.url && this.crawler) {
			this.dom = await this.crawler.getDOM(this.url.href);
			if (this.dom.body()) {
				this.hash = this.dom.body().hash();
			}
			this.ready = true;
			return this;
		}
		return false;
	}

	simulateLoading(html, url = 'http://localhost:3000', crawler = this.crawler) {
		this.crawler = crawler;
		this.dom = new FckffDOM(html);
		if (this.dom.body()) {
			this.hash = this.dom.body().hash();
		}
		this.ready = true;
		this.url = URL.parse(url);
		this.domain = URL.parse(URL.resolve(this.url.href, '/'));
		return this;
	}

	html(selector) {
		if (selector) {
			return this.dom.querySelector(selector).map(node => node.html());
		}
		return this.dom.html();
	}

	querySelector(selector) {
		return this.dom.querySelector(selector);
	}

	getContent(type = 'HTML', force = false) {
		if (!this.scored || force) {
			this.scoreDOM();
		}

		const cleanedDom = _.cloneDeep(this.dom);
		const mean = Helpers.mean(this.entropies);
		const deviation = Helpers.standardDeviation(this.entropies, mean);

		console.log(cleanedDom.html());
		cleanedDom._nodes.forEach(node => {
			const entropy = (parseFloat(node.data('entropy')) - mean) / (deviation || 1);
			node.data('entropy', entropy);
			if (entropy <= 0) {
				node.remove();
			}
		});

		console.log('\n');
		console.log(cleanedDom.html());

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

	returnUrls($ = this.$) {
		const urls = [];
		this.dom.getLinks().forEach(href => {
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
		return _.uniqBy(urls, url => url.href);
	}

	scoreNode(node, otherNodes, schnuffel = false, allHashes) {
		if (otherNodes.filter(n => n && n.hash() === node.hash()).length > 0) {
			node.setData('entropy', 0);
			return 0;
		}

		if (_.includes(allHashes, n => n === node.hash())) {
			entropy -= node.getText().length;
		}


		/**
		 * Score it by distance to other sites aka. entropy
		 */
		let entropy = Classifier.classify(node);

			/**
			 * Test if enough sites were crawled.
			 * If not use only Classifier.
			 */
			if (schnuffel) {
				const text = node.text();
				const scores = [];

				const lengthSites = otherNodes.length;
				for (let i = 0; i < lengthSites; i++){
					if (!otherNodes[i]) {
						scores.push(text.length);
					} else {
						const otherText = otherNodes[i].text();
						scores.push(leven(this.clean(text), this.clean(otherText)));
					}
				}
				if (scores.length > 0) {
					entropy = Helpers.mean(scores);
				}
			}
		if (!node.isLeaf()) {
			const childEntropies = node.getChildren().map((child, index) => {
				return this.scoreNode(child, otherNodes.map(n => {
					return n.getChildren()[index];
				}).filter(n => n instanceof FckffDOM.Node), schnuffel, allHashes)
			});
			entropy += _.sum(childEntropies);
		}
		node.setData('entropy', entropy);
		this.entropies.push(entropy);
		return entropy;
	}

	clean(text) {
		return text.replace(/\t|\n/gi, '');
	}

	/**
	 * This functions runs only once per DOM. For repeated scoring set parameter force true.
	 * @param site
	 * @param sites
	 * @param force (Boolean) if true the DOM is scored again
	 * @returns {*}
	 */
	scoreDOM(site = this, sites = this.crawler.sites) {
		sites = sites.filter(s => site.domain.hostname === s.domain.hostname);
		/**
		 * Sites with the same hash are filtered out.
		 * The resulting array should contain only unique sites.
		 * @type {Array.<*>}
		 */
		const otherSites = sites.filter(s => {
			return site.hash !== s.hash;
		});

		const allHashes = _.flatten(otherSites.map(s => s.dom._nodes.filter(n => n.isLeaf()).map(n => n.getHash())));

		this.scoreNode(site.dom.body(), otherSites.map(s => {
			return s.dom.body();
		}), otherSites.length > 0, allHashes);
		this.scored = true;
	}
}
export {Site as default};
