"use strict";

var os = require('os');
var gm = require('gm').subClass({ imageMagick: true });
var fs = require('fs');

var nconf = module.parent.require('nconf');
var path = module.parent.require('path');
var validator = module.parent.require('validator');
var winston = module.parent.require('winston');

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

// mostly copied from NodeBB/src/controllers/uploads.js
plugin.upload = function(data, callback) {
	if (parseInt(meta.config.allowFileUploads, 10) !== 1) {
		return callback(new Error('[[error:uploads-are-disabled]]'));
	}
	uploadFile(data.uid, data.image, callback);
};

function uploadFile(uid, uploadedFile, callback) {
	if (plugins.hasListeners('filter:uploadFile')) {
		return plugins.fireHook('filter:uploadFile', {file: uploadedFile, uid: uid}, callback);
	}

	if (!uploadedFile) {
		return callback(new Error('[[error:invalid-file]]'));
	}

	if (uploadedFile.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
		return callback(new Error('[[error:file-too-big, ' + meta.config.maximumFileSize + ']]'));
	}

	if (meta.config.hasOwnProperty('allowedFileExtensions')) {
		var allowed = file.allowedExtensions();
		var extension = path.extname(uploadedFile.name);
		if (allowed.length > 0 && allowed.indexOf(extension) === -1) {
			return callback(new Error('[[error:invalid-file-type, ' + allowed.join('&#44; ') + ']]'));
		}
	}

	saveFileToLocal(uploadedFile, callback);
}

function saveFileToLocal(uploadedFile, callback) {
	var filename = uploadedFile.name || 'upload';

	filename = Date.now() + '-' + validator.escape(filename).substr(0, 255);
	file.saveFileToLocal(filename, 'files', uploadedFile.path, function(err, upload) {
		if (err) {
			return callback(err);
		}

		callback(null, {
			url: nconf.get('relative_path') + upload.url,
			name: uploadedFile.name
		});
	});
}

module.exports = plugin;
