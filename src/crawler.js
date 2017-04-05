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
import EventEmitter from 'events';
import Site from './site';
import Levenshtein from 'levenshtein';
import NLP from 'google-nlp-api';
import Translate from '@google-cloud/translate';
import process from 'process';
import Sitemapper from 'sitemapper';
import RobotsParser from 'robots-parser';

class Crawler extends EventEmitter {
	constructor(seed, options) {
		super();
		this.reset();
		EventEmitter.call(this);
		this.queue = [];

		if (options) {
			this.options = options;
		} else {
			this.options = {
				readyIn: 50,
				goHaywire: false,
				userAgent: 'CrawlyMcCrawlface',
				expireDefault: 7 * 24 * 60 * 60 * 1000
			}
		}

		this.originals = [];
		this.sites = [];
		this.crawled = [];
		this.expiries = {};

		this.ready = this.init(seed);
	}

	async init(seed) {
		if (Array.isArray(seed)) {
			this.queue = seed.map(url => {
				return URL.parse(url);
			});
		} else if (typeof seed === 'string') {
			this.queue.push(URL.parse(seed));
		}
		const urls = _.unique(this.queue.map(url => {
			return URL.parse(URL.resolve(url.href, '/'));
		}));
		this.domains = []
		for (let i in urls){
			const url = urls[i];
			const domain = {
				hostname: url.hostname,
				robot: await this.getRobot(url)
			};
			this.domains.push(domain);
		}
		/**
		 * This must be in an extra loop because getSitemap calls addToQueue which uses this.domains
		 */
		for (let i in urls){
			const url = urls[i];
			this.getSitemap(url);

		}
		return true;
	}

	each(cb) {
		_.forEach(this.sites, cb);
	}

	start() {
		this.workQueue(this, false);
	}

	async getSitemap(url) {
		const sitemap = new Sitemapper();
		try{
			const result = await sitemap.fetch(url.resolve('/sitemap.xml'));
			_.forEach(result.sites, site => {
				this.addToQueue(site);
			});
		}
		catch (e){
			console.log(e);
		}
	}

	async getRobot(url) {
		try{
			const response = await this.fetch(url.resolve('/robots.txt'));
			return RobotsParser(url.resolve('/robots.txt'), response);
		}catch (e){
			return RobotsParser(url.resolve('/robots.txt'), '');
		}


	}

	reset() {
		this.state = {
			finished: false,
			ready: false,
			stopped: false,
			working: []
		};
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

	workQueue(crawler = this, recursive = false) {
		if (!recursive) {
			crawler.reset();
		}

		if (crawler.queue.length > 0 && !crawler.state.stopped) {
			const url = _.first(crawler.queue);
			crawler.crawled.push(url.href);
			crawler.queue.shift();
			const site = new Site(url.href, crawler);
			const promise = crawler.workSite(site, crawler);
			if (recursive) {
				return crawler.workQueue(crawler, true);
			}
			promise.then(() => {
				crawler.workQueue(crawler, true);
			}).catch(e => {
				throw e;
			})
		}
	}

	/**
	 * If a site is worked it is registered in this.state.working.
	 * If this array has length of 0, no site is currently worked.
	 * @returns {boolean}
	 */
	isWorking() {
		return this.state.working.length !== 0
	}

	/**
	 * Registers the site the function currently works on in state.
	 * @param site
	 */
	working(site) {
		const url = site.url.href;
		this.state.working.push(url);
	}

	/**
	 * Call when site is worked to remove it from this.state.working array
	 * @param site
	 */
	worked(site) {
		const url = site.url.href;
		const index = this.state.working.indexOf(url);
		if (index > -1) {
			this.state.working.splice(index, 1);
		}
	}

	async workSite(site, crawler) {
		await this.ready;
		crawler.working(site);
		try{
			await site.load();
		}catch (e){
			console.log(e);
			this.emit('error', e);
		}finally{
			crawler.worked(site);
		}
		const urls = site.returnUrls();
		urls.forEach(url => {
			this.addToQueue(url);
		});
		crawler.sites.push(site);
		this.emit('siteAdded', site);
		this.emit('sitesChanged', crawler.sites.length);

		const queueEmpty = crawler.queue.length === 0 && !crawler.isWorking();
		const minimalSitesCrawled = crawler.sites.length >= crawler.options.readyIn;
		if ((queueEmpty || minimalSitesCrawled) && !crawler.state.ready) {
			crawler.state.ready = true;
			this.emit('ready', this);
		}
		if ((crawler.queue.length === 0 || crawler.state.stopped)
			&& !crawler.finished && !crawler.isWorking()) {
			crawler.state.finished = true;
			this.emit('finished', this);
			crawler.stop();
		}
	}

	addToQueue(url, crawler = this) {
		const domain = _.find(crawler.domains, domain => {
			return domain.hostname === url.hostname;
		});
		if (domain && domain.robot.isAllowed(url.href, crawler.options.userAgent) && crawler.crawled.indexOf(url.href) === -1) {
			crawler.queue.push(url);
		}
	}

	getContent(url, type = 'PLAIN_TEXT') {
		const site = this.getByUrl(url);
		if (!site) {
			throw new Error(404, 'Site not found');
		}
		site.scoreDOM();
		return site.getContent(type);
	}

	getJSON(url) {
		const site = this.getByUrl(url);
		if (!site) {
			throw new Error(404, 'Site not found');
		}
		site.scoreDOM();
		return {
			html: site.getContent('HTML'),
			text: site.getContent('PLAIN_TEXT')
		};
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
			response = this.clean(await this.fetch(url));
		}catch (e){
			console.error(e);
			throw e;
		}
		if (this.cache) {
			let expire = this.options.expireDefault;
			if (this.expiries[url]) {
				expire = this.expiries[url];
			}
			this.cache.set(url, response, expire);
		}
		return cheerio.load(response);
	}

	clean(string) {
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
	async getData(url, features = {
									extractSyntax: true,
									extractEntities: true,
									extractDocumentSentiment: false
								}, type = 'PLAIN_TEXT', encoding = 'UTF8') {

		const text = this.getContent(url, type);
		const language = await Crawler.getLanguage(text).then(language);
		const nlp = new NLP();
		if (language === 'en') {
			return await nlp.annotateText(text, type, encoding, features);
		}
		const translation = await Crawler.getTranslation(text);
		return await nlp.annotateText(translation, type, encoding, features);
	}

	static async getTranslation(text) {
		if (!process.env.GOOGLE_TRANSLATE_API) {
			throw new Error('Please set key for Google Translate API');
		}
		const translate = Translate({key: process.env.GOOGLE_TRANSLATE_API});
		const results = await translate.translate(text, 'en');
		return results[0];
	}

	static async getLanguage(text) {
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
		this.state.stopped = true;
	}

	setCache(cache) {
		if (typeof cache.get !== 'function' || typeof cache.set !== 'function') {
			throw new TypeError('This is not a valid cache. It needs a set and a get function.');
		}
		this.cache = cache;
	}
}
export {Crawler as default};
