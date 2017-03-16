const http = require('http');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');
const path = require('path');

const serve = serveStatic(path.join(__dirname, '/x'));

var server = {};
const config = {
	port: 8000
};

exports.listen = function(port) {
	if (typeof port === 'Number' && port > 0 && port <= 65535) {
		config.port = p
	}
	server = http.createServer(function(req, res) {
		let done = finalhandler(req, res);
		serve(req, res, done);
	});
	server.listen(8000);
};

exports.close = function(callback) {
	server = {};
};

exports.config = config;