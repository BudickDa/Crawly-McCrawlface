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
	const files = inputFiles.filter((inputFile, index) => {
		return overwrite || !_.includes(outputFiles, inputFile);
	});

	const promises = files.map((file, index) => {
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
			const header = `${site.activateSchnuffelMode ? 'schnuffel' : 'classifier'} ${site.dom.getOriginal().indexOf('<table>') !== -1 ? 'table' : 'div'} ${site.dom._nodes.length} ${site.domain.hostname} ${site.__url} ${site.hash}`;
			const doc = `${header}\n${cleanEval}`;
			return new Promise(resolve => {
				fs.writeFile(destionation, doc, resolve);
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
		this.timeout(24 * 60000);
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
					const cleanEvalData = clean(arr[0].data.substring(arr[0].data.indexOf('\n') + 1));
					const testData = clean(arr[1].data.substring(arr[1].data.indexOf('\n') + 1));
					const firstLine = arr[0].data.split('\n')[0];

					const quality = Helpers.compareText(cleanEvalData, testData);
					results.push({quality: quality, filename: arr[0].filename, firstLine: firstLine});
				});
				const qualities = results.map(q => q.quality)
				const mean = Helpers.mean(qualities);
				fs.writeFile(cleanevalPathResult, `"sep= "\n${results.map(q => `${q.filename} ${q.quality} ${q.firstLine}\n`).join('')}`);
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
