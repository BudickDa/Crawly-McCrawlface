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
 * You should have received a copy of the GNU General Public License
 * along with Crawly McCrawlface. If not, see <http://www.gnu.org/licenses/>.
 */

import cheerio from 'cheerio';
import request from 'request';
import URL from 'url';
import _ from 'underscore';
import Chance from 'chance';
import EventEmitter from 'events';
import Site from './site';
import Levenshtein from 'levenshtein';
import NLP from 'google-nlp-api';
import Translate from '@google-cloud/translate';
import process from 'process';

const chance = new Chance();

class Crawly extends EventEmitter {
	constructor(seed, options) {
		super();
		EventEmitter.call(this);
		this.queue = [];
		if (Array.isArray(seed)) {
			this.queue = seed.map(url => {
				return URL.parse(url);
			});
		} else if (typeof seed === 'string') {
			this.queue.push(URL.parse(seed));
		}
		this.domains = _.unique(this.queue.map(url => {
			return URL.parse(URL.resolve(url.href, '/')).hostname;
		}));

		if (options) {
			this.options = options;
		} else {
			this.options = {
				readyIn: 50,
				goHaywire: false
			}
		}

		this.sites = [];
		this.crawled = [];

		this.stopped = false;
	}

	getByUrl(url) {
		if (this.sites.length === 0) {
			return;
		}
		let index = -1;
		let distance = url.length / 2;
		this.sites.forEach((site, i) => {
			const tmp = new Levenshtein(site.url.href, url).distance;
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

	addCache(cache) {
		this.cache = cache;
	}

	workQueue(crawler = this) {
		if (crawler.queue.length > 0) {
			const url = _.first(crawler.queue);
			crawler.crawled.push(url.href);
			crawler.queue.shift();
			const site = new Site(url.href, crawler);
			site.load().then(site => crawler.workSite(site, crawler)).catch(e => {
				this.emit('error', e);
			});
		}
	}

	workSite(site, crawler) {
		const urls = site.returnUrls();
		urls.forEach(url => {
			if (crawler.crawled.indexOf(url.href) === -1 && (crawler.goCrazy || crawler.domains.indexOf(url.hostname) !== -1)) {
				crawler.queue.push(url);
			}
		});
		crawler.sites.push(site);
		this.emit('siteAdded', site);
		this.emit('sitesChanged', crawler.sites.length);
		if (crawler.sites.length >= this.options.readyIn || crawler.queue.length === 0) {
			this.emit('ready');
		}
		if (crawler.queue.length === 0 || this.stopped) {
			this.stopped = false;
			this.emit('finished');
		} else {
			crawler.workQueue(crawler);
		}
	}

	getContent(url, type = 'PLAIN_TEXT') {
		const site = this.getByUrl(url);
		site.scoreDOM();
		return site.getContent(type);
	}

	async getDOM(url) {
		let response;
		if (this.cache) {
			try{
				const data = await
					this.cache.get(url);
				if (data) {
					return cheerio.load(data);
				}
			}catch (e){
				console.error(e);
				throw e;
			}
		}
		try{
			response = await
				this.fetch(url);
		}catch (e){
			console.error(e);
			throw e;
		}
		if (this.cache) {
			this.cache.set(url, response);
		}
		return cheerio.load(response);
	}

	/**
	 * Returns data extracted with the Google NLP API
	 * @param url
	 * @param features
	 * @param type
	 * @param encoding
	 * @returns {Promise.<*>}
	 */
	async getData(url, features = {
									extractSyntax: true,
									extractEntities: true,
									extractDocumentSentiment: false
								}, type = 'PLAIN_TEXT', encoding = 'UTF8') {

		console.log('Get Data:');
		const text = this.getContent(url, type);
		const language = await this.getLanguage(text).then(language);
		const nlp = new NLP();
		if (language === 'en') {
			return await nlp.annotateText(text, type, encoding, features);
		}
		const translation = await this.getTranslation(text);
		return await nlp.annotateText(translation, type, encoding, features);
	}

	async getTranslation(text) {
		if (!process.env.GOOGLE_TRANSLATE_API) {
			throw new Error('Please set key for Google Translate API');
		}
		const translate = Translate({key: process.env.GOOGLE_TRANSLATE_API});
		const results = await translate.translate(text, 'en');
		return results[0];
	}

	async getLanguage(text) {
		if (!process.env.GOOGLE_TRANSLATE_API) {
			throw new Error('Please set key for Google Translate API');
		}
		const translate = Translate({key: process.env.GOOGLE_TRANSLATE_API});
		const results = await translate.detect(text);
		let detection = results[0];
		return detection.language;
	}

	fetch(url) {
		return new Promise(function(resolve, reject) {
			request.get(url, function(err, response, body) {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	stop() {
		this.stopped = true;
	}

	setCache(cache) {
		if (typeof cache.get !== 'function' || typeof cache.set !== 'function') {
			throw new TypeError('This is not a valid cache. It needs a set and a get function.');
		}
		this.cache = cache;
	}
}
export {Crawly as default};
