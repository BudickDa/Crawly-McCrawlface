import request from 'request';
import cheerio from 'cheerio';
import URL from 'url';
import _ from 'underscore';
import Levenshtein from 'levenshtein';

export default class Crawly {
  constructor(urlString) {
    if (!urlString) {
      return;
    }
    const crawler = {};
    crawler.url = URL.parse(urlString);
    crawler.domain = URL.parse(URL.resolve(crawler.url.href, '/'));
    crawler.sites = [];
    return this.getDOM(crawler.url.href).then($ => {
      $ = this.cleanDOM($);
      $('a').each(function() {
        const href = $(this).attr('href');
        if (urlString === href) {
          return;
        }
        if (href.indexOf('mailto:') !== -1) {
          return;
        }
        if (URL.parse($(this).attr('href')).hostname !== null
          && crawler.domain.hostname !== URL.parse($(this).attr('href')).hostname) {
          return;
        }
        crawler.sites.push(URL.resolve(crawler.domain.href, $(this).attr('href')));
      });
      crawler.dom = $;
      crawler.sites = _.uniq(crawler.sites);
      return crawler;
    }).then(crawler => {
      return Promise.all(crawler.sites.map(urlString => {
        return this.getDOM(urlString);
      }));
    }).then(all => {
      const doms = all.map(this.cleanDOM);
      this.scoreDOM(crawler.dom, doms);
      return crawler;
    }).then(crawler => {
      return this.removeTemplate(crawler.dom);
    });
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

  async getDOM(url) {
    let response;
    try {
      response = await this.fetch(url);
    } catch (e) {
      console.error(e);
    }
    return cheerio.load(response);
  }

  cleanDOM($) {
    $('style').remove();
    $('script').remove();
    $('link').remove();
    $('meta').remove();
    /**
     * Clean every emtpy tag except images
     */
    $('*').each((index, element) => {
      $(element).attr('class', null);
      $(element).attr('id', null);
      if (element.name === 'img') {
        return;
      }
      if ($(element).text().length === 0) {
        $(this).remove()
      }
    });
    return $;
  }

  getOnlyText(node, dom) {
    const clone = dom(node).clone();
    clone.children().remove();
    return clone.text();
  }

  scoreNode(node, otherDomNodes, dom, otherDoms) {
    let score = 0;
    const lengthOtherDoms = otherDoms.length;
    const text = this.getOnlyText(node, dom);

    for (let i = 0; i < lengthOtherDoms; i++) {
      let otherText = this.getOnlyText(otherDomNodes[i], otherDoms[i]);
      let distance = new Levenshtein(text, otherText).distance;
      score += distance;
    }
    dom(node).data('score', score);


    _.forEach(node.children(), (child, index) => {
      score += this.scoreNode(dom(child), otherDomNodes.map((element, i) => {
        return otherDoms[i](element.children()[index]);
      }), dom, otherDoms);
    });
    dom(node).data('full-score', score);
    return score;
  }

  scoreDOM(dom, otherDoms) {
    return this.scoreNode(dom('body'), otherDoms.map(item => {
      return item('body');
    }), dom, otherDoms);
  }

  removeTemplate($, threshold = 0.3) {
    this.removeTheWeak($('body'), $, threshold);
    console.log($.html());
  }

  removeTheWeak(node, $, threshold) {
    const children = $(node).children().toArray();
    if (children.length === 0) {
      return;
    }

    const scores = children.map(e => {
      return parseInt($(e).data('full-score'));
    });

    const mean = scores.reduce(function(a, b) {
        return a + b;
      }) / scores.length;
    const limit = mean * (1 - threshold);

    children.forEach(element => {
      if($(element).data('full-score') > limit) {
        this.removeTheWeak(element, $, threshold);
      }else{
        $(element).remove();
      }
    });

  }
}
