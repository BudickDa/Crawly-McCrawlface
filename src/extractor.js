/**
 * Created by Daniel Budick on 25 Mär 2017.
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

import cheerio from 'cheerio';
import _ from 'underscore';
import Helpers from './helpers';

class Extractor {
	static extractContent($) {
		Extractor.normalizeDOM($);
		Extractor.cleanScoredDOM($);
		const title = $('title').text();
		const extractedDom = cheerio.load(`<html><head><title>${title}</title></head><body scored=true></body></html>`);
		_.forEach($('body').children(), node => {
			Extractor.addStrongToDOM(node, $, extractedDom);
		});
		return extractedDom.html();
	}

	static normalizeDOM($) {
		//console.log($.html());
		if($('body').attr('normalized')){
			return;
		}

		const entropies = {
			'a': [],
			'default': [],
			'textDensity': []
		};

		$('[entropy]').each((index, element) => {
			const e = $(element);
			const entropy = parseInt(e.attr('entropy'));
			entropies['textDensity'].push(parseInt(e.attr('text-density')));
			const name = $(element).prop('name').toLowerCase();
			if(Array.isArray(entropies[name])){
				entropies[name].push(entropy);
			}else{
				entropies['default'].push(entropy);
			}
		});
		const mean = {};
		const deviation = {};
		for (let index in entropies){
			mean[index] = Helpers.mean(entropies[index]);
			deviation[index] = Helpers.deviation(entropies[index]);
		}

		$('body').attr('normalized', true);
		Helpers.traverse($('body'), function(root, args) {
			const name = args.$(root).prop('name');
			let key = 'default';
			if(args.mean[name]){
				key = name;
			}
			/**
			 * Normalize entropy
			 */
			const entropy = args.$(root).attr('entropy') - args.mean[key] / (args.deviation[key] || 1);
			args.$(root).attr('entropy', entropy);
			const textDensity = args.$(root).attr('text-density') - args.mean['textDensity'] / (args.deviation['textDensity'] || 1);
			args.$(root).attr('text-density', textDensity);
		}, {mean: mean, deviation: deviation, $: $});
	}

	/**
	 * Delete empty or cluttered elements
	 * @param $
	 */
	static cleanScoredDOM($) {
		let removed = 0;
		$('body *').each((index, node) => {
			const element = $(node);

			const entropy = element.attr('entropy');
			/*let entropy = 0;
			if (typeof valueAsString === 'number') {
				entropy = valueAsString;
			}
			if (typeof valueAsString === 'string') {
				/*
				 Little workaround to get rid of , set by i18n in some browsers
				 */
			/*	entropy = parseInt(valueAsString.replace(/\./g, '').replace(',', '.'));
			}*/

			const textDensity = element.attr('text-density');

			if (entropy <= 0 || element.text().replace(/\s|\t|\n/gi, '').length === 0 || textDensity <= 0) {
				if (element.children().length === 0) {
					element.remove();
					removed++;
				}
				if (element.prop('tagName') === 'A') {
					element.remove();
					removed++;
				}
			}
		});
		if (removed !== 0) {
			Extractor.cleanScoredDOM($);
		}
	}


	/**
	 * Adds strong nodes from DOM ($) to DOM provided as parameter strongDOM
     * @param node
	 * @param $
	 * @param strongDOM
	 */
	static addStrongToDOM(node, $, strongDOM) {
		node = $(node);
		const entropy = node.attr('entropy');
		if (entropy > 0) {
			const tag = node.prop('tagName');
			strongDOM('body').append(`<${tag} entropy=${entropy}>${node.html()}</${tag}>`);
		} else {
			_.forEach(node.children(), function(node) {
				return Extractor.addStrongToDOM(node, $, strongDOM);
			});
		}
	}
}
export {Extractor as default};
