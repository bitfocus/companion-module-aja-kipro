const assert = require('node:assert/strict')
const { test } = require('node:test')
const http = require('node:http')
const api = require('../src/api')
const actions = require('../src/actions')

test('HTTP authentication, action commands and polling survive the runtime upgrade', async (t) => {
	const requests = []
	const server = http.createServer((req, res) => {
		let body = ''
		req.on('data', (data) => {
			body += data
		})
		req.on('end', () => {
			requests.push({ url: req.url, cookie: req.headers.cookie, body })
			res.setHeader('Content-Type', 'text/plain')
			if (req.url === '/authenticator/login') {
				res.setHeader('Set-Cookie', 'session=fixture')
				res.end(JSON.stringify({ login: 'success' }))
			} else if (req.url.includes('wait_for_config_events')) {
				res.end(
					JSON.stringify([
						{ param_id: 'eParamID_DisplayTimecode', str_value: '01:02:03:04' },
						{ param_id: 'eParamID_TransportState', int_value: 2 },
					]),
				)
			} else if (req.url.includes('eParamID_MediaState')) {
				res.end(
					JSON.stringify({ name: 'eParamID_MediaState', value: 'Record' }),
				)
			} else {
				res.end('{}')
			}
		})
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	t.after(() => new Promise((resolve) => server.close(resolve)))
	let definitions
	const instance = {
		...api,
		...actions,
		config: {
			host: `127.0.0.1:${server.address().port}`,
			password: 'secret',
			polling: true,
		},
		state: {},
		availableClips: [],
		log() {},
		updateStatus() {},
		checkVariables() {},
		checkFeedbacks() {},
		setActionDefinitions(value) {
			definitions = value
		},
		parseVariablesInString: async (value) =>
			value.replace('$(fixture:clip)', 'take42'),
	}
	async function invoke(callback, count = 1) {
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(
				() => reject(new Error('HTTP reply timed out')),
				3000,
			)
			instance.handleReply = (err, data) => {
				try {
					assert.equal(err, null)
					api.handleReply.call(instance, err, data)
					if (--count === 0) {
						clearTimeout(timeout)
						resolve()
					}
				} catch (error) {
					clearTimeout(timeout)
					reject(error)
				}
			}
			Promise.resolve(callback()).catch(reject)
		})
	}
	await invoke(() => instance.doAuthenticate())
	assert.equal(instance.authenticated, true)
	assert.equal(requests[0].body, 'password_provided=secret')
	instance.initActions()
	await invoke(() => definitions.play.callback({ options: {} }))
	assert.equal(
		requests.at(-1).url,
		'/config?action=set&paramid=eParamID_TransportCommand&value=1',
	)
	assert.equal(requests.at(-1).cookie, 'session=fixture')
	await invoke(
		() =>
			definitions.customClipName.callback({
				options: { clipname: '$(fixture:clip)' },
			}),
		2,
	)
	assert.ok(requests.some((r) => r.url.endsWith('CustomClipName&value=take42')))
	instance.connectionID = 42
	await invoke(() => instance.doRequestUpdate(), 2)
	assert.equal(instance.state.TransportState, 'RECORDING')
	assert.equal(instance.state.TC_frames, '04')
	assert.equal(instance.state.MediaState, 'Record')
	assert.equal(instance.waiting, false)
	instance.startConnectTimer()
	instance.startRequestTimer()
	assert.equal(instance.connectTimer, undefined)
	instance.stopRequestTimer()
	assert.equal(instance.requestTimer, undefined)
})
