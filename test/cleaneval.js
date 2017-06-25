const fs = require('fs');
const assert = require('assert');
const URL = require('url');
const cheerio = require('cheerio');
const _ = require('lodash');
const Helpers = require('my-helpers');
const leven = require('leven');
const exec = require('child_process').exec;

const Crawler = require('./../index');

const cleanevalPathInput = './test/cleaneval/input';
const cleanevalPathGoldStandard = './test/cleaneval/gold_standard';
const cleanevalPathOutput = './test/cleaneval/output';
const cleanevalPathResult = './test/cleaneval/result.csv';

const crawler = new Crawler([]);

function readFile(filename) {
	return new Promise((resolve, reject) => {
		try{
			fs.readFile(filename, (err, buffer) => {
				if (err) reject(err); else {
					resolve({data: buffer.toString('utf8'), filename: filename});
				}
			});
		}catch (err){
			reject(err);
		}
	});
};


const allTestFiles = fs.readdirSync(cleanevalPathGoldStandard).map(testFile => testFile.replace('.txt', ''));
const inputFiles = fs.readdirSync(cleanevalPathInput)
	.map(inputFile => inputFile.replace('.html', ''))
	.filter(inputFile => _.includes(allTestFiles, inputFile));
const testFiles = allTestFiles.filter(testFile => _.includes(inputFiles, testFile));
const outputFiles = fs.readdirSync(cleanevalPathOutput).map(outputFile => outputFile.replace('.txt', ''));

function createTestData(overwrite) {
	const files = inputFiles.filter(inputFile => {
		return overwrite || !_.includes(outputFiles, inputFile);
	});
	const promises = files.map(file => {
		return readFile(`${cleanevalPathInput}/${file}.html`);
	});
	return Promise.all(promises).then(data => {
		return data.map(file => {
			const html = file.data.substring(file.data.indexOf('\n') + 1);
			const firstLine = file.data.split('\n')[0];
			const $ = cheerio.load(firstLine);
			return {
				html: html,
				url: $('text').attr('id'),
				encoding: $('text').attr('encoding'),
				file: _.last(file.filename.split('/')).replace('.html', '')
			};
		});
	}).then(data => {
		crawler.sites = data.map(d => {
			const site = new Crawler.Site(d.url, crawler);
			site.simulateLoading(d.html, d.url);
			site.__url = d.url;
			site.__file = d.file;
			return site;
		});
		return Promise.all(crawler.sites.map((site, index) => {
			const destionation = `${cleanevalPathOutput}/${site.__file}.txt`;
			const cleanEval = crawler.getContent(site.__url, 'CLEANEVAL');
			return new Promise(resolve => {
				if (cleanEval) {
					fs.writeFile(destionation, cleanEval, resolve);
				} else {
					console.log(site.__url, site.__file, cleanEval);
					console.log(crawler.getByUrl(site.__url).getContent('CLEANEVAL'));
					console.log('\n');

				}
			});
		}));
	});
}

function clean(string) {
	return string.replace(/<p>|<h>|<l>|<x>/g, '');
}

describe('Run CleanEval as test', function() {
	it('should return a value between 0 and 100 % about how many is correct.', function(done) {
		//return done();
		this.timeout(12 * 60000);
		createTestData().then(() => {
			const loadTestFiles = fs.readdirSync(cleanevalPathOutput).map(file => {
				return Promise.all([
					readFile(`${cleanevalPathOutput}/${file}`),
					readFile(`${cleanevalPathGoldStandard}/${file}`)
				])
			});
			return Promise.all(loadTestFiles).then(allTests => {
				const results = [];
				allTests.forEach(arr => {
					const testData = clean(arr[1].data.substring(arr[1].data.indexOf('\n') + 1));
					const cleanEvalData = clean(arr[0].data);
					const quality = Helpers.compareText(cleanEvalData, testData);
					results.push({quality: quality, filename: arr[0].filename});
				});
				const qualities = results.map(q => q.quality)
				const mean = Helpers.mean(qualities);
				fs.writeFile(cleanevalPathResult, `sep=,\n${results.map(q => `${q.filename},${q.quality}\n`).join('')}`);
				assert(mean > 0);
				done();
			}).catch(err => {
				throw err;
			});
		}).catch(err => {
			console.error(err);
			done();
		});
	});
});
