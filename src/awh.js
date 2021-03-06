const TAG = 'AWH';

const Router = apprequire('server').routerAwh;

Router.get('/', (req, res) => {
	res.json({ error: { message: 'You should call in POST' } });
});
 
Router.post('/', async(req, res) => {
	if (req.body == null) {
		console.error(TAG, 'empty body');
		return res.json({ data: { error: 'Empty body' } });
	}

	console.info(TAG, 'request');
	console.dir(req.body, { depth: 10 });

	const body = req.body;
	const sessionId = body.sessionId;

	// From AWH can came any session ID, so ensure it exists on our DB
	let session = await IOManager.getSession(sessionId);
	if (session == null) {
		console.error(TAG, `creating a missing session ID with ${sessionId}`);
		session = new Data.Session({ _id: sessionId });
		session.save();
	}

	try {
		
		let fulfillment = await AI.apiaiResultParser(body, session);
		fulfillment.data.remoteTransform = true;
		
		console.info(TAG, 'output fulfillment');
		console.dir(fulfillment, { depth: 10 });

		res.json(fulfillment);
	
	} catch (ex) {
		console.info(TAG, 'error', ex);
		res.json({ data: { error: ex } });
	}
});

console.info(TAG, 'started');