"use strict";

var os = require('os'),
	gm = require('gm').subClass({ imageMagick: true }),
	fs = require('fs'),
	plugin = {};

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

	if(data.extension === '.gif') {
		gm().in(data.path)
			.in('-coalesce')
			.resize(data.width || null, data.height || null)
			.write(data.target || data.path, done);
	} else {
		gm(data.path)
			.resize(data.width || null, data.height || null)
			.write(data.target || data.path, done);
	}
};

plugin.size = function(data, callback) {
	gm(data.path).size(function (err, size) {
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
	gm(path).size(function(err, value){
		callback(err);
	});
};

plugin.normalise = function(data, callback) {
	gm(data.path).toBuffer('png', function(err, buffer) {
		if (err) {
			return callback(err);
		}
		fs.writeFile(data.path + '.png', buffer, 'binary', callback);
	});
};

module.exports = plugin;
