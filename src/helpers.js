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
import _ from 'underscore';
import Levenshtein from 'levenshtein';

class Helpers {
	static traverse(root, fnc, args) {
		root = args.$(root);
		fnc(root, args);
		_.forEach(root.children(), node => {
			return Helpers.traverse(node, fnc, args);
		});
	}

	/**
	 * Calculate mean out of array
	 * @param array
	 * @returns {number}
	 */
	static mean(array) {
		if (!Array.isArray(array)) {
			throw new TypeError('Parameter of mean must be an array.');
		}
		const sum = array.reduce((a, b) => a + b, 0);
		const length = array.length || 1;
		return sum / length;
	}

	/**
	 * Calcualte standard deviation
	 * @param array
	 * @returns {number}
	 */
	static deviation(array) {
		const mean = Helpers.mean(array);
		let deviation = 0;
		array.forEach(v => {
			deviation += Math.pow(parseInt(v) - mean, 2);
		});
		return Math.sqrt(deviation / (array.length || 1));
	}


	/**
	 *
	 * @param node {Node}
	 * @returns {number}
	 */
	static textDensity(node) {
		if (!Helpers.isNode(node)) {
			throw new TypeError('Parameter node in Helper.textDensity has to be a cheerio node. Or must have the function html() and text()');
		}
		return (node.text() || '').length / (node.html() || ' ').length;
	}

	/**
	 * Get Levenshtein distance between two strings
	 * @param text
	 * @param otherText
	 * @returns {*|number}
	 */
	static  getDistance(text, otherText) {
		const cleanText = text.replace(/\n|\t|\s/,'').replace(/\d/gi, 'd');
		const cleanOtherText = otherText.replace(/\n|\t|\s/,'').replace(/\d/gi, 'd');
		const distance = new Levenshtein(cleanText, cleanOtherText).distance;
		return distance;
	}

	/**
	 * Get the equality of two texts zero to one by taking the levenshein distance and the length of the text.
	 * @param text
	 * @param otherText
	 */
	static compareText(text, otherText) {
		const distance = Helpers.getDistance(text, otherText);
		return 1 - distance / (text.length || 1);
	}

	static count(node, el) {
		return (node.find(el) || []).length;
	}

	static isNode(node) {
		return Boolean(node) && _.isFunction(node.text) && _.isFunction(node.html);
	}
}
export {Helpers  as  default};
