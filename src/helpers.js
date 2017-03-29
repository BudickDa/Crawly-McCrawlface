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
			deviation += Math.pow(parseFloat(v) - mean, 2);
		});
		return Math.sqrt(deviation / array.length);
	}
}
export {Helpers as default};
