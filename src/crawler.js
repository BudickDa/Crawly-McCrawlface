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

import FckffDOM from 'fckffdom';
import request from 'request';
import URL from 'url';
import _ from 'lodash';
import EventEmitter from 'events';
import Site from './site';
import leven from 'leven';
import NLP from 'google-nlp-api';
import Translate from '@google-cloud/translate';
import process from 'process';
import Sitemapper from 'sitemapper';
import RobotsParser from 'robots-parser';
import WAE from 'web-auto-extractor';

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

    this.sites = [];
    this.crawled = [];
    this.expiries = {};
    this.filters = [];

    /**
     * Ids of timeouts that are started are stored in here. All timeouts are cancelled when the crawler is stopped.
     */
    this.timeouts = [];

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
    const urls = _.uniq(this.queue.map(url => {
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

  eachHTML(cb) {
    _.forEach(this.sites, site => {
      cb(site.getContent('HTML'));
    });
  }

  eachText(cb) {
    _.forEach(this.sites, site => {
      cb(site.getContent('PLAIN_TEXT'));
    });
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


  /**
   * Adds a filter.
   * If filters are set only sites that have a url that pass a match with at least one of the filters are added to the queue.
   * Other sites, except those in the seed, are ignored.
   * @param filter (string|RegExp)
   */
  addFilter(filter) {
    /**
     * Only regex or string allowed.
     */
    if (!(filter instanceof RegExp || typeof filter === 'string')) {
      throw new TypeError('addFilter expects Regex or string as parameter');
    }
    /**
     * Prevents filters from beeing doubled.
     */
    if (!_.includes(this.filters, filter)) {
      this.filters.push(filter);
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
    url = URL.parse(url);
    const sites = this.sites.filter(s => {
      return s.url.host === url.host;
    });

    /**
     * First try to find exact url
     */
    const i = _.findIndex(this.sites, s => s.url.path === url.path);
    if (i > -1) {
      return this.sites[i];
    }

    /**
     * Secondly try to find url by removing slashes
     */
    const j = _.findIndex(this.sites, s => s.url.path.replace(/\//gi, '') === url.path.replace(/\//gi, ''));
    if (j > -1) {
      return this.sites[j];
    }

    /**
     * If this fails find the next best url
     */
    let index = -1;
    let distance = url.length / 2;
    this.sites.forEach((s, i) => {
      const tmp = new leven(s.url.path, url.path);
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

  workQueue(crawler = this, recursive = false, idle = 1000) {
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
    } else if (crawler.state.stopped) {
      //stop execution
      return;
    } else if (crawler.queue.length === 0) {
      //This happens when the queue is empty,
      //wait until stack is empty and try again
      const timeout = 5000;
      if (idle > timeout) {
        console.log('Crawler timed out.');
        crawler.stop();
        if (!crawler.state.finished) {
          //send finished event if not already did so
          crawler.state.finished = true;
          this.emit('finished', crawler);
        }
        return;
      }
      crawler.timeouts.push(setTimeout(function() {
        crawler.workQueue(crawler, false, idle * 2);
      }, idle));
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
   * Checks if on this is currently worked on.
   * @param site (Site | String | URL)
   */
  isWorkedOn(site) {
    let url = '';
    if (site instanceof Site) {
      url = site.url.href;
    } else if (site && typeof site.href === 'string') {
      url = site.href;
    } else if (typeof site === 'string') {
      url = site;
    } else {
      throw new TypeError('isWorkedOn needs Site or url as String or as URL as parameter.')
    }
    return _.includes(this.state.working, url);
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
      this.emit('ready', crawler);
    }
    if ((crawler.queue.length === 0 || crawler.state.stopped)
      && !crawler.finished && !crawler.isWorking()) {
      const t = setTimeout(() => {
        if ((crawler.queue.length === 0 || crawler.state.stopped)
          && !crawler.state.finished && !crawler.isWorking()) {
          crawler.state.finished = true;
          this.emit('finished', crawler);
          crawler.stop();
        } else {
          clearTimeout(t);
        }
      }, 1000 + Math.random() * 1000);
    }
  }

  addToQueue(url, crawler = this) {
    if (!url) {
      return;
    }
    if (typeof url === 'string') {
      url = URL.parse(url);
    }
    /**
     * Filter the returned urls with this.filters
     */
    const href = url.href;
    /**
     * If not filters are added, nothing is filtered, every sites passes
     */
    let match = this.filters.length === 0;

    /**
     * Test every filter and concat them with OR.
     * todo: let user decide between OR and AND
     * todo: maybe let user decide between whitelist and blacklist
     */
    crawler.filters.forEach(filter => {
      match = match || Boolean(href.match(filter));
    });

    const domain = _.find(crawler.domains, domain => {
      return domain.hostname === url.hostname;
    });

    if (!match) {
      return;
    }

    if (!(domain && domain.robot.isAllowed(url.href, crawler.options.userAgent))) {
      return;
    }

    if (crawler.alreadyCrawled(url.href)) {
      return;
    }

    crawler.queue.push(url);
  }

  alreadyCrawled(href) {
    return _.includes(this.crawled, href) || _.includes(this.queue.map(u => u.href), href);
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


  /**
   * Gets the html from an url and creates a DOM with the help of cheerio.
   * It checks first if there is a cache, if yes it tries the cache for the domain first.
   * If there is nothing in the cache, it uses the fetch method to load the html from the internet
   * @param url
   * @returns {Promise.<*>}
   */
  async getDOM(url) {
    let response;
    if (this.cache) {
      try{
        const data = this.cache.get(url);
        /**
         * Check if data is a promise.
         * There are a lot of polyfills for promise out there, so we should not only check for instance of promise
         * but also simlpy if it has a then method.
         */
        if (data && (data instanceof Promise || typeof data.then === 'function')) {
          /**
           * We have to wait for the promise to fullfill, before we can check, if there data is undefined.
           */
          const d = await data;
          if (d) {
            return new FckffDOM(d);
          }
        } else if (data && typeof data === 'string') {
          return new FckffDOM(data);
        } else if (data) {
          throw new TypeError(`get method of cache returns ${typeof data}. But it should be a Promise or a string. Content of data: ${data}`);
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
    return new FckffDOM(response);
  }

  clean(string) {
    return string.replace(/\t/gi, ' ').replace(/\s+/, ' ').replace(/<!--(.*?)-->/gi, '');
  }

  /**
   * Returns data extracted with the Google NLP API
   * or
   * had already been available withe scheme.org annotation
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
    const site = this.getByUrl(url);
    console.log(WAE().parse(site.getOrinial()));
    return;


    const text = site.getContent(type);
    const language = await Crawler.getLanguage(text).then(language);
    const nlp = new NLP();
    if (language === 'en') {
      return await
        nlp.annotateText(text, type, encoding, features);
    }
    const translation = await
      Crawler.getTranslation(text);
    return await
      nlp.annotateText(translation, type, encoding, features);
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
    this.timeouts.forEach(t => {
      clearTimeout(t);
    });
  }

  setCache(cache) {
    if (typeof cache.get !== 'function' || typeof cache.set !== 'function') {
      throw new TypeError('This is not a valid cache. It needs a set and a get function.');
    }
    this.cache = cache;
  }
}

export {Crawler as default};
