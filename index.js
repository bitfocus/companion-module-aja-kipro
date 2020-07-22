const instance_skel = require('../../instance_skel');

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config);

		this.actions(); // export actions

		// Example: When this script was committed, a fix needed to be made
		// this will only be run if you had an instance of an older "version" before.
		// "version" is calculated out from how many upgradescripts your intance config has run.
		// So just add a addUpgradeScript when you commit a breaking change to the config, that fixes
		// the config.

		this.addUpgradeScript(function () {
			// just an example
			if (self.config.host !== undefined) {
				self.config.old_host = self.config.host;
			}
		});
	}

	updateConfig(config) {
		this.config = config;
	}

	init() {
		this.status(this.STATE_OK);
	}

	config_fields() {
		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will control the Aja KiPro series.'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				regex: this.REGEX_IP
			}
		]
	}

	destroy() {
		this.debug("destroy");
	}

	actions(system) {
		this.system.emit('instance_actions', this.id, {
			'play': {label: 'Play'},
			'stop': {label: 'Stop'},
			'rec': {label: 'Record'},
			'next': {label: 'Next Clip'},
			'prv': {label: 'Previous Clip'},
			'ff': {label: 'Fast Forward'},
			'rev': {label: 'Fast Reverse'},
			'stepF': {label: 'Step Forward'},
			'stepB': {label: 'Step Back'},
			'format': {label: 'Stop and Format'},
			'load': {
				label: 'Load Clip(id)',
				options: [
					{
						type: 'textinput',
						label: 'Clip Name',
						id: 'idx',
						default: ''
					}
				]
			},
			'loop': {
				label: 'Loop Clip',
				options: [
					{
						type: 'dropdown',
						label: 'On / Off',
						id: 'idx',
						choices: [
							{id: '0', label: 'Loop Off'},
							{id: '1', label: 'Loop On'}
						]
					}
				]
			},
		});
	}

	action(action) {
		let cmd = null;
		let opt = action.options;
		this.debug('action: ', action);

		switch (action.action) {
			case 'play':
				cmd = 'TransportCommand&value=1';
				break;
			case 'stop':
				cmd = 'TransportCommand&value=4';
				break;
			case 'rec':
				cmd = 'TransportCommand&value=3';
				break;
			case 'next':
				cmd = 'TransportCommand&value=9';
				break;
			case 'prv':
				cmd = 'TransportCommand&value=10';
				break;
			case 'ff':
				cmd = 'TransportCommand&value=5';
				break;
			case 'rev':
				cmd = 'TransportCommand&value=6';
				break;
			case 'stepF':
				cmd = 'TransportCommand&value=7';
				break;
			case 'stepB':
				cmd = 'TransportCommand&value=8';
				break;
			case 'load':
				cmd = 'GoToClip&value=' + opt.idx;
				break;
			case 'loop':
				cmd = 'LoopPlay&value=' + opt.idx;
				break;
			case 'format':
				let run_format = async function (cmd, timeout) {
					return new Promise(resolve => {
						setTimeout(function () {
							resolve(this.run_cmd(cmd));
						}.bind(this), timeout);
					});
				}.bind(this);

				// Stop current clip completely, if playing
				run_format('TransportCommand&value=4', 0);
				run_format('TransportCommand&value=4', 1000);

				// Set format option
				run_format('StorageCommand&value=4&configid=0', 2000);

				// Take the format command
				run_format('CustomTake&value=1&configid=0', 2000);
				break;
		}

		if(cmd !== null) {
			this.run_cmd(cmd);
		}
	}

	run_cmd(cmd) {
		this.system.emit('rest_get', 'http://' + this.config.host + '/config?action=set&paramid=eParamID_' + cmd, function(err, data, response) {
			if(!err) {
				this.log('warn', 'Error from kipro: ' + result);
				return;
			}
		}.bind(this));
	}
}

exports = module.exports = instance;
