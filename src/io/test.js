const TAG = 'IO.Test';

const _ = require('underscore');
const fs = require('fs');
const readline = require('readline');

const emitter = exports.emitter = new (require('events').EventEmitter)();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let initial_strings = [];
try {
	initial_strings = fs.readFileSync(__etcdir + '/io_test.txt').toString().split("\n");
} catch (err) {}

async function registerGlobalSession() {
	return IOManager.registerSession({
		sessionId: null,
		io_driver: 'test'
	});
}

exports.startInput = async function() {
	if (IOManager.session == null) {
		await registerGlobalSession();
	}

	let msg = initial_strings.shift();

	if (!_.isEmpty(msg)) {
		console.info(TAG, 'input', msg);
		return emitter.emit('input', {
			session: IOManager.session,
			params: {
				text: msg
			}
		});
	}
	
	rl.question('> ', (answer) => {
		if (/^EVAL /.test(answer)) {
			answer = answer.replace(/^EVAL /, '');
			console.debug(answer);
			try {
				eval(answer);
			} catch (err) {
				console.error(err);
			}
			exports.startInput();
		} else {
			emitter.emit('input', {
				session: IOManager.session,
				params: {
					text: answer
				}
			});
		}
	});

	exports.startInput();
};

exports.output = async function(f) {
	await registerGlobalSession();

	console.info(TAG, 'output');
	emitter.emit('output', {
		session: IOManager.session,
		fulfillment: f
	});

	for (let i = 0; i < 50; i++) process.stdout.write("="); process.stdout.write("\n");
	console.dir(f, { depth: 10 });
	for (let i = 0; i < 50; i++) process.stdout.write("="); process.stdout.write("\n");
};