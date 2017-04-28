exports.id = 'draw.index';

const _config = config.ai.gcloud;

const ImagesClient = require('google-images');
const client = new ImagesClient(_config.cseId, _config.apiKey);

module.exports = function({ sessionId, result }) {
	return new Promise((resolve, reject) => {
		let { parameters: p, fulfillment } = result;

		client.search(`disegno "${p.q}"`)
		.then((images) => {
			let img = images.getRandom();
			resolve({
				data: {
					photo: {
						remoteFile: img.url
					}
				}
			});
		})
		.catch(reject);
	});
};