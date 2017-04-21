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

class LinkQuotaFilter {
	static measure(node) {
		if (!Helpers.isNode(node)) {
			throw new TypeError('Parameter node in LinkQuotaFilter.measure has to be a cheerio node. Or must have the function html() and text()');
		}
		const layout = ['a', 'aside', 'button', 'div', 'main', 'nav', 'li', 'ul'];
		const content = ['abbr', 'address', 'article', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'span', 'p'];
		const c = content.reduce((memo, el) => {
			if (typeof memo === 'string') {
				memo = Helpers.count(node, memo);
			}
			return memo + Helpers.count(node, el);
		})
		const l = layout.reduce((memo, el) => {
			if (typeof memo === 'string') {
				memo = Helpers.count(node, memo);
			}
			return memo + Helpers.count(node, el);
		});
		return c / (l || 1);
	}
}

/**
 * Scores node with several features (higher is always better):
 * - Text density (text / html)
 * - LQF (Link Quota Filter): Content elements vs layout elements as children
 * - Images as children
 * - Paragraphs as children
 * - inverse Hyperlinks: 1 / number of anker tags
 * - inverse Divs: 1 / number of div tags
 * - teh: Looks for words like 'is' or 'the' in multiple languages
 */
class Classifier {
	static classify(node) {
		if (!Helpers.isNode(node)) {
			throw new TypeError('Parameter node in Classifier.classify has to be a cheerio node. Or must have the function html() and text()');
		}
		const textDensity = Helpers.textDensity(node);
		const lqf = LinkQuotaFilter.measure(node);
		const imageNumber = Helpers.count(node, 'img') + Helpers.count(node, 'svg');
		const paragraphs = Helpers.count(node, 'a');

		const countHyperlinks = Helpers.count(node, 'a');
		const inverseHyperlinks = countHyperlinks ? 1 / countHyperlinks : 0;

		const divCount = Helpers.count(node, 'div')
		const inverseDivs = divCount ? 1 / divCount : 0;

		const words = ['is', 'the', 'le', 'la', 'der', 'die', 'das'];
		const teh = words.reduce((memo, word) => {
			if (typeof memo === 'string') {
				memo = (node.text().match(new RegExp(memo, 'gi')) || []).length;
			}
			return memo + (node.text().match(new RegExp(word, 'gi')) || []).length;
		});

		return textDensity + lqf + imageNumber + paragraphs + inverseHyperlinks + inverseDivs + teh;
	}
}

Classifier.LinkQuotaFilter = LinkQuotaFilter;
export {Classifier as default};
