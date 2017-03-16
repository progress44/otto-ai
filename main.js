require('./boot');

if (config.cron) {
	require(__basedir + '/cron');
}

if (config.server) {
	require(__basedir + '/server');
}

function outCognitive(data, image, io) {
	return new Promise((resolve, reject) => {
		const Cognitive = require(__basedir + '/support/cognitive');
		Cognitive.face.detect(image.remoteFile, (err, resp) => {
			if (err) return reject(err);
			if (resp.length === 0) return reject();

			Cognitive.face.identify([ resp[0].faceId ], (err, resp) => {
				if (resp.length === 0 || resp[0] == null || resp[0].candidates.length === 0) return reject(err);
				let person_id = resp[0].candidates[0].personId;

				Memory.Contact
				.where({ person_id: person_id })
				.fetch({ required: true })
				.then((contact) => {

					const name = contact.get('first_name');
					const responses = [
					`Hey, ciao ${name}!`,
					`Ma... è ${name}`,
					`Da quanto tempo ${name}!, come stai??`
					];

					resolve({ 
						text: responses.getRandom() 
					});
				})
				.catch(reject);
			}); 

		});
	});
}


let IOs = [];
config.ioDrivers.forEach((driver) => {
	IOs.push(require(__basedir + '/io/' + driver));
});

function errorResponse(e) {
	let io = this;
	e.error = e.error || {};
	io.output(e)
	.then(io.startInput)
	.catch(io.startInput);
}

function onIoResponse({ error, data, params }) {
	console.info('onIoResponse', { error, data, params });
	let io = this;

	try {

		if (error) {
			throw error;
		}

		let promise = null;

		// If this session has pending actions, 
		// then resolve this first
		if (io.pendingActions[data.sessionId]) {

			console.debug("Has pending actions for this session");

			promise = Actions[ io.pendingActions[data.sessionId] ]()({
				pending: true,
				params: params
			}, {
				io: io,
				data: data
			});

		} else {

			if (params.text) {
				promise = APIAI.textRequest({
					data: data, 
					text: params.text, 
					io: io
				});
			} else if (params.image) {
				promise = outCognitive(data, params.image, io);
			} else if (params.answer) {
				promise = new Promise((resolve, reject) => {
					resolve({ text: params.answer });
				});
			} else {
				throw {
					unsupported: true,
					message: 'This input type is not supported yet. Supported: text, image, answer' 
				};
			}

		}

		promise
		.then((resp) => { 
			io.output({
				data: data,
				params: resp
			})
			.then(io.startInput)
			.catch(io.startInput); 
		})
		.catch((perr) => {

			console.error('Promise error', perr);

			// Check if this query could be solved using the Learning Memory Module. 
			new Memory.Learning()
			.query((qb) => {
				qb.select(Memory.__knex.raw(`*, MATCH (input) AGAINST ("${params.text}" IN NATURAL LANGUAGE MODE) AS score`));
				qb.having('score', '>', '0');
				qb.orderBy(Memory.__knex.raw('RAND()'));
			})
			.fetch({ require: true })
			.then((learning) => {
				console.debug('Found a learning reply');
				onIoResponse.call(io, {
					data: data,
					params: {
						answer: learning.get('reply')
					}
				});
			})
			.catch(() => {
				errorResponse.call(io, {
					data: data,
					error: perr
				});
			});
		});

	} catch (ex) {
		console.error('Unhandled exception', ex);
		errorResponse.call(io, {
			data: data,
			error: ex
		});
	}
}

IOs.forEach((io) => {
	io.emitter.on('input', onIoResponse.bind(io));
	io.startInput();
});
