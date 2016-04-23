"use strict";

var os = require('os');
var gm = require('gm').subClass({ imageMagick: true });
var fs = require('fs');

var nconf = module.parent.require('nconf');
var path = module.parent.require('path');
var validator = module.parent.require('validator');
var winston = module.parent.require('winston');
var async = module.parent.require('async');

var meta = module.parent.require('./meta');
var file = module.parent.require('./file');
var plugins = module.parent.require('./plugins');

var plugin = {};

if (os.platform() === 'linux') {
	require('child_process').exec('/usr/bin/which convert', function(err, stdout, stderr) {
		if(err || !stdout) {
			winston.warn('Couldn\'t find convert. Did you install imagemagick?');
		}
	});
}

plugin.resize = function(data, callback) {
	function done(err, stdout, stderr) {
		callback(err);
	}

	var dimensions = (data.width ? data.width: '') + (data.height ? 'x' + data.height : '') + '>';

	if(data.extension === '.gif') {
		gm().in(data.path)
			.in('-coalesce')
			.in('-resize')
			.in(dimensions)
			.write(data.target || data.path, done);
	} else {
		gm(data.path)
			.in('-resize')
			.in(dimensions)
			.write(data.target || data.path, done);
	}
};

plugin.normalise = function(data, callback) {
	if(data.extension !== '.png') {
		gm(data.path).toBuffer('png', function(err, buffer) {
			if (err) {
				return callback(err);
			}
			fs.writeFile(data.path + '.png', buffer, 'binary', callback);
		});
	} else {
		callback();
	}
};

plugin.filetypeAllowed = function(data, callback) {
	return callback(null);
};

module.exports = plugin;
