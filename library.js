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
			.in('-resize')
			.in(data.width+'x'+data.height+'^')
			.write(data.path, done);
	} else {
		gm(data.path)
			.in('-resize')
			.in(data.width+'x'+data.height+'^')
			.gravity('Center')
			.crop(data.width, data.height)
			.write(data.path, done);
	}
};

plugin.normalise = function(data, callback) {
	if(data.extension !== '.png') {
		gm(data.path).toBuffer('png', function(err, buffer) {
			if (err) {
				return callback(err);
			}
			fs.writeFile(data.path, buffer, 'binary', callback);
		});
	} else {
		callback();
	}
};

module.exports = plugin;
