const Cheerio = require('cheerio');
const Crawly = require('./index');

const crawler = new Crawly();
/**
 * Test static methods
 */

/**
 * Test cleanDOM:
 * Should remove style, script and nodes without text except images
 */
const testOne = Cheerio.load('<style></style><div><script></script><span>Test</span><div></div><img></div>');
const testOneResult = crawler.cleanDOM(testOne);
console.log('Test cleanDOM passed: ', testOneResult.html() === '<div><span>Test</span><img></div>');


/**
 * Test getOnlyText:
 * Should return text of node, not text, that is part of children
 */
const testTwo = Cheerio.load('<div id="target">This should be returned!<span>This should be ignored</span><div>This should be ignored too.</div></div>');
const testTwoResult = crawler.getOnlyText(testTwo('#target'), testTwo);
console.log('Test getOnlyText passed: ', testTwoResult === 'This should be returned!');

/**
 * Test scoreNode:
 *
 */
const testThree = Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 1<span>a</span></div></body>');
const compareDomsOne = [
  Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 2<span>b</span></div></body>'),
  Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 3<span>c</span></div></body>'),
  Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 4<span>d</span></div></body>')
];
crawler.scoreNode(
  testThree('body'),
  compareDomsOne.map(element => {
    return element('body');
  }),
  testThree,
  compareDomsOne
);
console.log('Test A scoreNode passed: ', testThree('.content').data('score') === 3);
console.log('Test B scoreNode passed: ', testThree('.content').data('full-score') === 6);

/**
 * 
 */
const testFour = Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Content 1</div></body>');
const compareDomsTwo = [
  Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum gravida vulputate lectus luctus iaculis. Donec suscipit dui sed justo sodales consectetur.</div></body>'),
  Cheerio.load('<body><div><nav>Template</nav></div><div class="content"> Proin porta ultrices quam, sit amet lacinia odio finibus nec. Fusce lectus ex, tempus non aliquet non, vehicula ac magna.</div></body>'),
  Cheerio.load('<body><div><nav>Template</nav></div><div class="content">Fusce pellentesque, est nec auctor semper, leo arcu pellentesque diam, ut porta nibh eros ac turpis.</div></body>')
];
crawler.scoreDOM(testFour, compareDomsTwo);
console.log('Test scoreDOM passed: ', testFour('.content').data('score') === 360);

/**
 * Test crawler on website:
 */
const budickeu = new Crawly('https://budick.eu');
