const TAG = 'SpeechRecognizer';

const speech = require('@google-cloud/speech')({
	keyFilename: __basedir + '/keys/gcloud.json'
});
const _ = require('underscore');

exports.recognize = function(stream, opt = {}) {
	return new Promise(async(resolve, reject) => {
		stream.pipe(exports.createRecognizeStream(opt, (err, text) => {
			if (err) return reject(err);
			resolve(text);
		}));
	});
};

exports.createRecognizeStream = function(opt = {}, callback) {
	_.defaults(opt, {
		interimResults: true,
		encoding: 'LINEAR16',
		sampleRate: 16000,
		language: config.language
	});

	const stream = speech.streamingRecognize({
		// If false or omitted, the recognizer will perform continuous recognition
		singleUtterance: true,
		// If true, interim results (tentative hypotheses) may be returned as they become available 
		interimResults: opt.interimResults,
		config: {
			encoding: opt.encoding,
			sampleRateHertz: opt.sampleRate,
			languageCode: getLocaleFromLanguageCode(opt.language)
		}
	});

	// stream.on('end', () => {
	// 	console.debug(TAG, 'end');
	// 	if (false === finished) {
	// 		finished = true;
	// 		callback({ unrecognized: true });
	// 	}      
	// });     

	stream.on('error', (err) => {
		console.error(TAG, err);
		callback(err);
	});

	stream.on('data', (data) => {
		if (data.results.length > 0) {
			var r = data.results[0];
			if (!_.isEmpty(r.alternatives)) {
				console.debug(TAG, r.alternatives[0].transcript);
			}
			if (r.isFinal) {
				const text = r.alternatives[0].transcript;
				console.info(TAG, 'recognized', text);
				callback(null, text);
			}
		}
	});

	return stream;
};