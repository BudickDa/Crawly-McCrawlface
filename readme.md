# Crawly McCrawlface
A small crawler that downloads html from the web and applying some content extraction.

#Install
`npm install crawly-mccrawlface`

    //Create crawler and supply seed as string or array of strings
    const crawler = new Crawly('https://budick.eu');
    //optional: add redis as cache
    crawler.addCache(redis.createClient());

    //start crawling
    crawler.start();
    crawler.on('finished', () => {
      // the crawler has loaded all the sites that could be reached by the seed from the domain of the seed.
      // get content of the site by its url



    });


# Going haywire
If you want your crawler never to stop, set the second parameter to true:
    const crawler = new Crawly([...some urls...], true);
On defautl the crawler will only get content from the domains that where in the seed.
On haywire mode the crawler will never stop and go crazy on the web. You should not use this mode for now.
Or use it at your own risk, I'm not you boss.


# Test

Test with:

`npm test`

# Content extraction
Content extraction will only work if at least five sites with the same template were crawled.
The extraction works by looking on the differences between the sites.
The nodes with a difference more than the mean differences of all nodes are extracted as content.

## Events:

### Crawler
`ready` is fired when five sites where loaded, this is the first point where content extraction can be applied.
If the content is crawled from different domains, the event will not be helpful anymore. You should use `siteAdded` or `sitesChanged`.

`siteAdded` is fired when a new site was added. It contains the new site as object.

`sitesChanged` is fired when a new site was added, it contains the count of all sites.

`finished` is fired when the queue is empty. On default usages, this is the point when everything is ready.

## API

todo
