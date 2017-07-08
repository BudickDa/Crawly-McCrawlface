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
		this.scores = [];
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

		if (!this.activateSchnuffelMode) {
			const meanScore = Helpers.mean(this.scores);
			const deviationScore = Helpers.standardDeviation(this.scores, meanScore);
			cleanedDom._nodes.forEach(node => {
				const score = (parseFloat(node.data('score')) - meanScore) / (deviationScore || 1);
				node.data('score', score);
				if (score < 0) {
					node.remove();
				}
			});
		} else {
			cleanedDom._nodes.forEach(node => {
				const entropies = [parseFloat(node.data('entropy'))];
				node.getSiblings().forEach(s => {
					entropies.push(parseFloat(s.data('entropy')));
				});
				const meanEntropy = Helpers.mean(entropies);
				const deviationEntropy = Helpers.standardDeviation(entropies, meanEntropy);

				const entropy = (parseFloat(node.data('entropy')) - meanEntropy) / (deviationEntropy || 1);
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

	scoreNode(node, otherNodes, allHashes) {
		/**
		 * Score it by distance to other sites aka. entropy
		 */
		const text = node.text();
		let entropy = 0;
		/**
		 * Test if enough sites were crawled.
		 * If not use only Classifier.
		 */
		if (this.activateSchnuffelMode) {

			const sameContext = otherNodes.filter(n => n && n.hash() === node.hash()).filter(n => {
				const parent = n.getParent();
				if (parent) {
					return Helpers.compareText(parent.getText(), node.getText()) > 0.8;
				}
				return false;
			});
			if (sameContext.length > 0) {
				node.setData('entropy', -sameContext.length);
				entropy -= sameContext.length;
			}


			if (_.includes(allHashes, n => n === node.hash())) {
				entropy -= node.getText().length;
			}

			const lengthSites = otherNodes.length;
			for (let i = 0; i < lengthSites; i++){
				if (!otherNodes[i]) {
					entropy += text.length;
				} else {
					const otherText = otherNodes[i].text();
					entropy += leven(this.clean(text), this.clean(otherText));
				}
			}
		} else {
			const {textDensity, lqf, partOfNav} = Classifier.classify(node);
			let offset = 0;
			if (partOfNav) {
				offset -= text;
			}
			const score = (textDensity + lqf) / 2;
			node.setData('score', score);
			this.scores.push(score);
		}

		if (!node.isLeaf()) {
			const childEntropies = node.getChildren().map((child, index) => {
				return this.scoreNode(child, otherNodes.map(n => {
					return n.getChildren()[index];
				}).filter(n => n instanceof FckffDOM.Node), allHashes)
			});
			entropy += _.sum(childEntropies);
		}

		node.setData('entropy', entropy);
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

		site.activateSchnuffelMode = otherSites.length > 0;
		site.scoreNode(site.dom.body(), otherSites.map(s => {
			return s.dom.body();
		}), allHashes);
		site.scored = true;
	}
}
export {Site as default};
