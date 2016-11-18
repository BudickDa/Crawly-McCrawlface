import cheerio from 'cheerio';
import XXH from 'xxhashjs';
import URL from 'url';
import _ from 'underscore';
import Levenshtein from 'levenshtein';

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
    this.content = {};
  }

  async load() {
    if (this.url && this.crawler) {
      this.$ = await this.crawler.getDOM(this.url.href);
      let text = this.$('body').html();
      if (!text) {
        text = '';
      }
      this.hash = XXH.h32(text, 0xABCD).toString(16);
      this.$ = this.cleanDOM(this.$);
    }
  }

  html(selector) {
    return this.$(selector).html();
  }

  getContent() {
    const elements = [];
    let sumEntropy = 0;
    const length = this.$('*').length;
    this.$('*').each((index, element) => {
      const score = parseInt(element.attribs['data-score'] || 0);
      const fullScore = parseInt(element.attribs['data-full-score'] || 0);
      const text = this.getOnlyText(element);
      const textLength = text.length;
      const entropy = Math.floor(score / (textLength + 1));
      sumEntropy += entropy;
      elements.push({
        element: element,
        entropy: entropy,
        fullScore: fullScore
      });
    });
    const mean = Math.round(sumEntropy / length);

    const content = elements.filter(element => {
      return element.entropy > mean;
    });
    let html = '';
    content.forEach(c => {
      html += this.$(c.element).html();
    });

    return html;
  }

  cleanDOM($ = this.$) {
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
      if (href.indexOf('mailto:') !== -1) {
        return;
      }
      if (href.indexOf('.pdf') !== -1) {
        return;
      }
      const parsedUrl = URL.parse(href);
      if (parsedUrl.hostname !== null) {
        urls.push(parsedUrl);
      } else {
        const absoluteUrl = URL.resolve(this.domain.href, href);
        urls.push(URL.parse(absoluteUrl));
      }
    });
    return urls;
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

    for (let i = 0; i < lengthSites; i++) {
      let otherText = this.getOnlyText(otherNodes[i], sites[i]);
      let distance = new Levenshtein(text, otherText).distance;
      score += distance;
    }
    this.scores.push(score);
    site.$(node).attr('data-score', score);


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

  removeTemplate($, threshold = 0.3) {
    this.removeTheWeak($('body'), $, threshold);
    return $.html();
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
      if ($(element).data('full-score') > limit) {
        this.removeTheWeak(element, $, threshold);
      } else {
        $(element).remove();
      }
    });

  }
}
