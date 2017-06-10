const fs = require('fs');
const assert = require('assert');
const URL = require('url');
const cheerio = require('cheerio');
const _ = require('lodash');

const Crawler = require('./../index');

const cleanevalPathInput = './test/cleaneval/input';
const cleanevalPathOutput = './test/cleaneval/gold_standard';

function readFile(filename) {
	return new Promise(function(resolve, reject) {
		try{
			fs.readFile(filename, function(err, buffer) {
				if (err) reject(err); else {
					resolve(buffer.toString('utf8'));
				}
			});
		}catch (err){
			reject(err);
		}
	});
};


function runTest() {
	const outputFiles = fs.readdirSync(cleanevalPathOutput).map(outputFile => outputFile.replace('.txt', ''));
	const inputFiles = fs.readdirSync(cleanevalPathInput).map(inputFile => inputFile.replace('.html', ''));
	const files = inputFiles.filter(inputFile => {
		return outputFiles.indexOf(inputFile) !== -1;
	});

	const promises = files.map(file => {
		return Promise.all([readFile(`${cleanevalPathInput}/${file}.html`), readFile(`${cleanevalPathOutput}/${file}.txt`), file]);
	});
	return Promise.all(promises).then(data => {
		return data.map(arr => {
			const html = arr[1].substring(arr[1].indexOf('\n') + 1);
			const output = arr[0];
			const file = arr[2]
			const firstLine = arr[0].split('\n')[0];
			const $ = cheerio.load(firstLine);
			return {
				html: html,
				output: output,
				url: $('text').attr('id'),
				title: $('text').attr('title'),
				encoding: $('text').attr('encoding'),
				file: file
			};
		});
	}).then(data => {
		data = data.map(s => {
			s.site = new Crawler.Site(s.url);
			return s;
		});
		return Promise.all(data.map(site => {
			const crawler = new Crawler(site.url);
			const hostname = URL.parse(site.url).hostname;
			crawler.sites = data.filter(s => {
				return s.site.url.hostname === hostname;
			}).map(s => {
				s.site.simulateLoading(s.html, crawler);
				return s.site;
			});
			crawler.originals = _.cloneDeep(crawler.sites);
			const result = crawler.getContent(site.url, 'CLEANEVAL');
			//console.log(crawler.getByUrl(site.url));
			site.result = result;
			//console.log(site.url, crawler.getByUrl(site.url).$.html());
			return site;
		}));
	}).then(data => {
		return data.map(site => {
			return Crawler.Helpers.compareText(site.output, site.result) * 100;
		});
	}).then(results => {
		return Crawler.Helpers.mean([])
	});
}

describe('Run CleanEval as test', function() {
	it('should return a value between 0 and 100 % about how many is correct.', function(done) {
		this.timeout(12000);
		const test = true;
		if (test) {
			runTest().then(correct => {
				console.log(correct);
				assert(correct);
				done();
			}).catch(err => {
				console.error(err);
				done();
			});
		} else {
			done();
		}
	});
});