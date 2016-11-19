import cheerio from 'cheerio';
import request from 'request';
import URL from 'url';
import _ from 'underscore';
import Chance from 'chance';
import EventEmitter from 'events';
import Site from './site';
import Levenshtein from 'levenshtein';

const chance = new Chance();

export default class Crawly extends EventEmitter {
  constructor(seed, goCrazy) {
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

    if (goCrazy) {
      this.goCrazy = Boolean(goCrazy);
    }

    this.sites = [];
    this.crawled = [];
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
      site.load().then(site => crawler.workSite(site, crawler));
    }
  }

  workSite(site, crawler) {
    const urls = site.returnUrls();
    _.forEach(urls, url => {
      if (crawler.crawled.indexOf(url.href) === -1 && (crawler.goCrazy || crawler.domains.indexOf(url.hostname) !== -1)) {
        crawler.queue.push(url);
      }
    });
    crawler.sites.push(site);
    this.emit('siteAdded', site);
    this.emit('sitesChanged', crawler.sites.length);
    console.log(crawler.queue.length);
    if (crawler.queue.length === 0) {
      console.log('Queue is empty');
      this.emit('finished');
    } else {
      crawler.workQueue(crawler);
    }
  }

  getContent(url) {
    const site = this.getByUrl(url);
    site.scoreDOM();
    return site.getContent();
  }

  async getDOM(url) {
    let response;
    if (this.cache) {
      try {
        const data = await this.cache.get(url);
        if (data) {
          return cheerio.load(data);
        }
      } catch (e) {
        console.error(e);
      }
    }

    try {
      response = await this.fetch(url);
    } catch (e) {
      console.error(e);
    }
    if (this.cache) {
      this.cache.set(url, response);
    }
    return cheerio.load(response);
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
}
