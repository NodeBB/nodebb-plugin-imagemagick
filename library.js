"use strict";

var os = require('os');
var gm = require('gm').subClass({ imageMagick: '7+' });
var fs = require('fs');
const winston = require.main.require('winston');
var plugin = {};

if (os.platform() === 'linux') {
	require('child_process').exec('/usr/bin/which convert', function(err, stdout) {
		if (err || !stdout) {
			winston.warn('Couldn\'t find convert. Did you install imagemagick?');
		}
	});
}

plugin.resize = function(data, callback) {
	var img = gm(data.path);
	if (data.path.endsWith('.gif')) {
		img = img.coalesce();
	}

	img.autoOrient()
		.resize(data.width || null, data.height || null)
		.write(data.target || data.path, function(err) {
			callback(err);
		});
};

plugin.size = function(data, callback) {
	gm(data.path).autoOrient().size(function(err, size) {
		if (err) {
			return callback(err);
		}
		var image = {
			path: data.path,
			width: size.width,
			height: size.height
		};
		callback(null, image);
	});
};

plugin.fileTypeAllowed = function(path, callback) {
	gm(path).size(function(err) {
		callback(err);
	});
};

plugin.normalise = function(data, callback) {
	gm(data.path).autoOrient().toBuffer('png', function(err, buffer) {
		if (err) {
			return callback(err);
		}
		fs.writeFile(data.path + '.png', buffer, 'binary', callback);
	});
};

module.exports = plugin;
