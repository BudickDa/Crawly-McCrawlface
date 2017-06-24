/**
 * Created by Daniel Budick on 17 Mär 2017.
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

require("babel-core/register");
require("babel-polyfill");
/**
 * This is necessary for Meteor > 1.4
 */
const regeneratorRuntime = require('babel-runtime/regenerator');
if (global.window !== undefined) {
	if (!Object.keys(global.window).includes('regeneratorRuntime')) {
		global.window.regeneratorRuntime = regeneratorRuntime
	}
}
if (!Object.keys(global).includes('regeneratorRuntime')) {
	global.regeneratorRuntime = regeneratorRuntime
}

const Crawly = require('./dist/crawler').default;
Crawly.Site = require('./dist/site').default;
Crawly.Classifier = require('./dist/classifier').default;
module.exports = Crawly;
