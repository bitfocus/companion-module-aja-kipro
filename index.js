var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	// Example: When this script was committed, a fix needed to be made
	// this will only be run if you had an instance of an older "version" before.
	// "version" is calculated out from how many upgradescripts your intance config has run.
	// So just add a addUpgradeScript when you commit a breaking change to the config, that fixes
	// the config.

	self.addUpgradeScript(function () {
		// just an example
		if (self.config.host !== undefined) {
			self.config.old_host = self.config.host;
		}
	});

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
};
instance.prototype.init = function() {
	var self = this;

	self.status(self.STATE_OK);

	debug = self.debug;
	log = self.log;
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will control Aja KiPro series '
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 8,
			regex: self.REGEX_IP
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;
	debug("destroy");
};

instance.prototype.actions = function(system) {
	var self = this;
	self.system.emit('instance_actions', self.id, {
		'play':    { label: 'Play'},
		'stop':    { label: 'Stop'},
		'rec':     { label: 'Record'},
		'next':    { label: 'Next Clip'},
		'prv':     { label: 'Previous Clip'},
		'ff':      { label: 'Fast Forward'},
		'rev':     { label: 'Fast Reverse'},
		'stepF':   { label: 'Step Forward'},
		'stepB':   { label: 'Step Back'},
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
						 { id: '0', label: 'Loop Off' },
						 { id: '1', label: 'Loop On' }
					 ]
				}
			]
		},
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd
	opt = action.options
	debug('action: ', action);

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
			cmd = 'D1Clip&value=' + opt.idx;
			break;

		case 'loop':
			cmd = 'LoopPlay&value=' + opt.idx;
			break;



	}


	if (cmd !== undefined) {
			self.system.emit('rest_get', 'http://' + self.config.host + '/config?action=set&paramid=eParamID_' + cmd,function (err, data, response) {
				if (!err) {
						self.log('Error from kipro: ' + result);
						return;
						}
					console.log("Result from REST: ", result);
					});
		}

};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
