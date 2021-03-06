const TAG = 'Messages';

const _ = require('underscore');
const util = require('util');

const library = _.extend({}, requireOrNull(__basedir + '/messages.json') || {}, requireOrNull(__basedir + '/messages-custom.json') || {});

exports.getRaw = function(key) {
	let str = library[key];
	if (str == null) {
		console.error(TAG, `unable to find the key ${key}`);
		return "";
	}
	return str;	
};

exports.get = function(key, ...args) {
	let str = exports.getRaw(key);
	return util.format(getRandomElement(str), ...args);	
};
