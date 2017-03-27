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
import request from 'request';
import URL from 'url';
import _ from 'underscore';
import Chance from 'chance';
import EventEmitter from 'events';
import Levenshtein from 'levenshtein';
import NLP from 'google-nlp-api';
import Translate from '@google-cloud/translate';
import process from 'process';
import Helpers from './helpers';

class Extractor {
    static extractContent($) {
        const entropies = $('[data-entropy]').map((index, element) => {
            return $(element).data('entropy');
        }).get();
        const sumEntropy = entropies.reduce((a, b) => a + b, 0);
        const length = entropies.length;

        /**
         * Calculate mean
         * @type {number}
         */
        const mean = Math.round(sumEntropy / length);

        /**
         * Calcualte standard deviation
         * @type {number}
         */
        let deviation = 0;
        entropies.forEach(v => {
            deviation += Math.pow(parseFloat(v) - mean, 2);
        });
        deviation = Math.sqrt(deviation / length);

        Helpers.traverse($('body'), function (root, args) {
            /**
             * Normalize entropy
             */
            args.$(root).attr('data-entropy', parseFloat(args.$(root).attr('data-entropy')) - args.mean / args.deviation);
        }, {mean: mean, deviation: deviation, $: $});

        Extractor.cleanScoredDOM($);

        const title = $('title').text();
        const extractedDom = cheerio.load(`<html><head><title>${title}</title></head><body></body></html>`);
        _.forEach($('body').children(), node => {
            Extractor.addStrongToDOM($, node, mean, deviation, extractedDom);
        });

        return extractedDom.html();
    }

    /**
     * Delete empty or cluttered elements
     * @param $
     */
    static cleanScoredDOM($) {
        $('*').each((index, node) => {
            const element = $(node);
            if (element.text().replace(/\s|\n|\t/gi, '').length === 0) {
                $(node).remove();
            }
        });
        let removed = 0;
        $('[data-entropy]').each((index, node) => {
            const element = $(node);
            /*
             Little workaround to get rid of , set by i18n in some browsers
             */
            const valueAsString = element.data('entropy');
            let entropy = 0;
            if(typeof valueAsString === 'number'){
                entropy = valueAsString;
            }
            if (typeof valueAsString === 'string') {
                entropy = parseFloat(valueAsString.replace(/\./g, '').replace(',', '.'));
            }
            if (element.children().length === 0 && entropy <= 1) {
                $(node).remove();
                removed++;
            }
        });
        if (removed !== 0) {
            Extractor.cleanScoredDOM($);
        }
    }

    /**
     * Adds strong nodes from DOM ($) to DOM provided as parameter strongDOM
     * @param $
     * @param node
     * @param mean
     * @param deviation
     * @param strongDOM
     */
    static addStrongToDOM($, node, mean, deviation, strongDOM) {
        node = $(node);
        if (parseFloat(node.data('entropy')) > 0) {
            const tag = node.prop('tagName');
            strongDOM('body').append(`<${tag}>${node.html()}</${tag}>`);
        } else {
            _.forEach(node.children(), function (node) {
                return Extractor.addStrongToDOM($, node, mean, deviation, strongDOM);
            });
        }
    }
}
export {Extractor as default};
