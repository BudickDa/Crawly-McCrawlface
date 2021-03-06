# Crawly McCrawlface
A small crawler that downloads html from the web and applying some content extraction.

#Install
`npm install crawly-mccrawlface`

    //Create crawler and supply seed as string or array of strings
    const crawler = new Crawly('https://budick.eu');

    //start crawling
    crawler.start();
    crawler.on('finished', () => {
      // the crawler has loaded all the sites that could be reached by the seed from the domain of the seed.
      // get content of the site by its url



    });

# Data extraction
The crawler uses google's NLP API to extract data from text. To use this feature you have to supply the key as environment variable:

**Windows:**
`setx GOOGLE_NLP_API 1234APIKEY`
or you can find the tool from System by typing 'environment' into the search box in start menu.

**Unix:**
`export GOOGLE_NLP_API=1234APIKEY`

**Or**:
Create .env file with the content:
`GOOGLE_NLP_API=1234APIKEY`

To accomplish that it uses the [google-nlp-api](https://www.npmjs.com/package/google-nlp-api) package.

# Caching
You can cache responses from websites using a simple object that has a set and get method and some persistence.

Some examples:

## Redis:

    const cache = {
        client: redis.createClient(),
        get: function(key){
            return this.client.get(key);
        },
        set: function(key, value){
            this.client.setex(key, 21600, value);
        }
    }
    crawler.addCache(cache);

## MongoDB in Meteor

    const cache = {
        client: new Mongo.Collection('cache'),
        //get can return a promise
        get: function(key){
            const doc = this.client.findOne({key: key});
            if(doc && new Date().getTime() - doc.timestamp < 21600){
                return doc.value;
            }else{
                return;
            }
        },
        set: function(key, value){
            this.client.upsert({key: key}, {value: value, timestamp: new Date().getTime()});
        }
    }
    crawler.addCache(cache);

# Options

    const optinons = {
        goHaywire: false,
        readyIn: 15
    };
    const crawler = new Crawly([...some urls...], options);

readyIn (Number):
Number of sites, that have to be loaded that ready-event is fired.

goHaywire (Boolean):
On defautl the crawler will only get content from the domains that where in the seed.
On haywire mode the crawler will never stop and go crazy on the web. You should not use this mode for now.
Or use it at your own risk, I'm not you boss.

# Events:

## Crawler
`ready` is fired when five sites where loaded, this is the first point where content extraction can be applied.
If the content is crawled from different domains, the event will not be helpful anymore. You should use `siteAdded` or `sitesChanged`.

`siteAdded` is fired when a new site was added. It contains the new site as object.

`sitesChanged` is fired when a new site was added, it contains the count of all sites.

`finished` is fired when the queue is empty. On default usages, this is the point when everything is ready.

`ready` is called, when there are enough sites (default: 50) to do a content extraction or all sites of domain were crawled.

# API
todo

# Test

Test with:

`npm test`

# Content extraction
Content extraction will only work if at least five sites with the same template were crawled.
The extraction works by looking on the differences between the sites.
The nodes with a difference more than the mean differences of all nodes are extracted as content.

# License
AGPL