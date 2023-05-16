module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will control the Aja KiPro series.'
			},
			{
				type: 'textinput',
				id: 'host',
				width: 6,
				label: 'Host/IP Address',
				default: '192.168.0.1'
			},
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Polling',
				value: 'Enabling polling will allow for feedback variables.<br>Some older KiPro units will return non HTTP compliant headers.<br>This results in a warning in the log and polling being disabled.'
			},
			{
				type: 'checkbox',
				label: 'Polling',
				id: 'polling',
				width: 1,
				default: true
			},
			{
				type: 'number',
				label: 'Polling Rate (ms)',
				id: 'pollingRate',
				width: 2,
				min: 10,
				max: 5000,
				default: 100,
				required: true
			},
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Authentication',
				value: 'Leave password blank for no authentication'
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				default: '',
				width: 12,
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false
			}
		]
	},
}
