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

import _ from 'lodash';
import FckffDOM from 'fckffdom';

class LinkQuotaFilter {
	static countLinksRecursivly(node) {
		if (node.isLeaf()) {
			return 0;
		}
		return node.getChildren().map(c => {
			return (c.getType === 'a' ? 1 : 0) + _.sum(LinkQuotaFilter.countLinksRecursivly(c));
		});
	}

	static measure(node) {
		if (!node instanceof FckffDOM.Node) {
			throw new TypeError('Parameter node in LinkQuotaFilter.measure has to be a cheerio node. Or must have the function html() and text()');
		}

		const textLength = node.getText().length;
		const linkQuota = _.sum(LinkQuotaFilter.countLinksRecursivly(node));

		if (node.isLeaf()) {
			return textLength;
		}
		return textLength / (linkQuota || 1);
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
		if (!node instanceof FckffDOM.Node) {
			throw new TypeError('Parameter node in Classifier.classify has to be a cheerio node. Or must have the function html() and text()');
		}

		/**
		 * If DOM has only one node, things get weird... let's prevent weirdness:
		 */
		if (node._dom._nodes.length === 1) {
			return node._text.length;
		}

		return {
			textDensity: TextDensity.measure(node),
			lqf: LinkQuotaFilter.measure(node),
			partOfNav: Classifier.isPartOfNav(node)
		};
	}

	/**
	 * Looks for hyperlinks in list items, which are typical for navbars
	 * @param node
	 * @returns {*|boolean}
	 */
	static isPartOfNav(node) {
		return node.getChildren().length === 1 && node.getChildren()[0].getType() === 'a' && node.getType() === 'l';
	}
}

class TextDensity {
	/**
	 * Calculates length of text of children divided by number of children
	 * @param node
	 * @returns {*}
	 */
	static measure(node) {
		const elenentCount = _.sum(TextDensity.countElementsRecursivly(node));
		const textLength = node.getText().length;

		return textLength / (elenentCount || 1);
	}


	static countElementsRecursivly(node) {
		if (node.isLeaf()) {
			return 0;
		}
		return node.getChildren().map(c => {
			return 1 + _.sum(TextDensity.countElementsRecursivly(c));
		});
	}
}

Classifier.LinkQuotaFilter = LinkQuotaFilter;
Classifier.TextDensity = TextDensity;
export {Classifier as default};
