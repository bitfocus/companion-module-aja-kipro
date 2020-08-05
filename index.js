const instance_skel = require('../../instance_skel');

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config);

		this.waiting = false;
		this.connectionID = 0;
		this.currentState = {
			internal : {},
			dynamicVariables : {},
		};

		this.actions(); // export actions


		if(this.config.requestInterval == undefined){
			//If the user has an existing config it is defaulted to not poll as to not change the function of the module without their action
			this.config.requestInterval = 0;
		}

		// Example: When this script was committed, a fix needed to be made
		// this will only be run if you had an instance of an older "version" before.
		// "version" is calculated out from how many upgradescripts your intance config has run.
		// So just add a addUpgradeScript when you commit a breaking change to the config, that fixes
		// the config.

		this.addUpgradeScript(function () {
			// just an example
			if (this.config.host !== undefined) {
				this.config.old_host = this.config.host;
			}
		});
	}

	updateConfig(config) {
		var restartTimer = false;

		if(config.requestInterval != this.config.requestInterval){ //Not checking port since it isn't user editable currently.
			restartTimer = true;
		}

		this.config = config;

		if(restartTimer) {
			if(this.config.requestInterval == 0){ //Timers need to stop and the state set
				this.status(this.STATE_OK);
				this.stopConnectTimer();
				this.stopRequestTimer();
			}
			else{ //Requests should be happening
				if(this.requestTimer !== undefined){ //Timer was running so restart it with a new timeout
					this.startRequestTimer();
				}
				else{
					this.startConnectTimer();
				}
				this.status(this.STATE_UNKNOWN);
			}
		}
	}

	init() {
		if(this.config.requestInterval == 0){
			this.status(this.STATE_OK);
		}
		else{
			this.status(this.STATE_UNKNOWN);
		}

		this.initVariables();
		this.init_presets();
		this.init_feedbacks();

		this.startConnectTimer(1000);
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
			},
			{
				type: 'number',
				id: 'requestInterval',
				label: 'Request Interval',
				width: 12,
				min: 0,
				default: 1,
				required: true
			},
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Request Interval',
				value: 'Request interval sets how frequently companion will poll the KiPro in milliseconds. 0=disabled'
			},
		]
	}

	destroy() {
		this.debug("destroy");

		this.stopRequestTimer();
		this.stopConnectTimer();
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

	init_presets() {
		var presets = [
			//Presets for Layers
			{
				category: 'Transport Control',
				label: 'Play',
				bank: {
					style: 'text',
					text: 'Play',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'play'
					}
				],
				feedbacks: [
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 6
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 2
						}
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Stop',
				bank: {
					style: 'text',
					text: 'Stop',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'stop'
					}
				],
				feedbacks: [
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 1
						}
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Record',
				bank: {
					style: 'text',
					text: 'Rec',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'rec'
					}
				],
				feedbacks: [
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(255,0,0),
							state: 6
						}
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Next',
				bank: {
					style: 'text',
					text: 'Next Clip',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'next'
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Previous Clip',
				bank: {
					style: 'text',
					text: 'Prev Clip',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'prv'
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Fast Forward',
				bank: {
					style: 'text',
					text: 'FF',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'ff'
					}
				],
				feedbacks: [
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 4
						}
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Rewind',
				bank: {
					style: 'text',
					text: 'Rev',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'rev'
					}
				],
				feedbacks: [
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 3
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 5
						}
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Step Forward',
				bank: {
					style: 'text',
					text: 'Step Forward',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'stepF'
					}
				]
			},
			{
				category: 'Transport Control',
				label: 'Step Backwards',
				bank: {
					style: 'text',
					text: 'Step Back',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'stepB'
					}
				]
			},
			{
				category: 'TimeCode',
				label: 'Full Timecode',
				bank: {
					style: 'text',
					text: '$('+this.label+':TC_hours):$('+this.label+':TC_min):$('+this.label+':TC_sec):$('+this.label+':TC_frames)',
					size: '7',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				}
			},
			{
				category: 'TimeCode',
				label: 'Timecode Hours',
				bank: {
					style: 'text',
					text: 'HOURS\\n$('+this.label+':TC_hours)',
					size: '14',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				}
			},
			{
				category: 'TimeCode',
				label: 'Full Minutes',
				bank: {
					style: 'text',
					text: 'MIN\\n$('+this.label+':TC_min)',
					size: '14',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				}
			},
			{
				category: 'TimeCode',
				label: 'Timecode Seconds',
				bank: {
					style: 'text',
					text: 'SEC\\n$('+this.label+':TC_sec)',
					size: '14',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				}
			},
			{
				category: 'TimeCode',
				label: 'Timecode Frames',
				bank: {
					style: 'text',
					text: 'FRAMES\\n$('+this.label+':TC_frames)',
					size: '14',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				}
			}
		];
		this.setPresetDefinitions(presets);
	}

	init_feedbacks() {
		var feedbacks = {};
		feedbacks['transport_state'] = {
			label: 'Change colors based on transport state',
			description: 'Sets the background according to the state of the KiPro playback',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 1,
					choices: [
						{ id: 1, label: "Stoped"},
						{ id: 2, label: "Playing Forward"},
						{ id: 3, label: "Playing Backward"},
						{ id: 4, label: "Fast Forward"},
						{ id: 5, label: "Fast Backward"},
						{ id: 6, label: "Recording"},
						{ id: 7, label: "Idle"}
					]
				},//State
				{
					type: 'colorpicker',
					label: 'On - Foreground color',
					id: 'fg',
					default: this.rgb(0,0,0)
				},//FG
				{
					type: 'colorpicker',
					label: 'On - Background color',
					id: 'bg',
					default: this.rgb(0,255,0)
				}//BG
			]
		};

		this.setFeedbackDefinitions(feedbacks);
	}

	feedback(feedback, bank) {
		if (feedback.type == 'transport_state') {
			let stateNum = 0;
			switch (this.currentState.dynamicVariables.State) {
				case "Stopped":
					stateNum = 1
					break;
				case "Playing":
					stateNum = 2
					break;
				case "Playing Backward":
					stateNum = 3
					break;
				case "Fast Forward":
					stateNum = 4
					break;
				case "Fast Backward":
					stateNum = 5
					break;
				case "Recording":
					stateNum = 6
					break;
				case "Idle":
					stateNum = 7
					break;
				default :
					break;
			}

			if (stateNum == feedback.options.state) {
				return { color: feedback.options.fg, bgcolor: feedback.options.bg};
			}
		}
	}

	initVariables() {
		// Initialize the current state and update Companion with the variables.
		var internal = {}
		if(this.currentState.internal != undefined){
			internal = this.currentState.internal
		}
		// Reinitialize the currentState variable, otherwise this variable (and the module's
		//	state) will be shared between multiple instances of this module.
		this.currentState = {};

		// The internal state of the connection
		this.currentState.internal = internal;

		// The dynamic variable exposed to Companion
		this.currentState.dynamicVariables = {
			'TC_hours':'00',
			'TC_min':'00',
			'TC_sec':'00',
			'TC_frames':'00',
			'State':'Idle'
		}

		this.setVariable('TC_hours', '00');
		this.setVariable('TC_min', '00');
		this.setVariable('TC_sec', '00');
		this.setVariable('TC_frames', '00');
		this.setVariable('State', 'Idle');

		var variables = [
			{label: 'TimeCode Hours',		name:  'TC_hours'},
			{label: 'TimeCode Minutes',		name:  'TC_min'},
			{label: 'TimeCode Seconds',		name:  'TC_sec'},
			{label: 'TimeCode Frames',		name:  'TC_frames'},
			{label: 'State',				name:  'State'}
		];

		this.setVariableDefinitions(variables);
	}

	updateVariable(name, value) {
		if (this.currentState.dynamicVariables[name] === undefined) {
			this.log('warn', "Variable " + name + " does not exist");
			return;
		}

		this.currentState.dynamicVariables[name] = value;
		this.setVariable(name, value);
	}

	startConnectTimer() {
		var timeout = 1000;

		// Stop the timer if it was already running
		this.stopConnectTimer();
		if(this.config.requestInterval > 0){
			this.log('info', "Starting connectTimer");
			// Create a reconnect timer to watch the socket. If disconnected try to connect.
			this.connectTimer = setInterval(function(){
				this.doConnect();
			}.bind(this), timeout);
		}
	}

	stopConnectTimer() {
		if (this.connectTimer !== undefined) {
			this.log('info', "Stopping connectTimer");
			clearInterval(this.connectTimer);
			delete this.connectTimer;
		}

	}

	startRequestTimer() {
		// Stop the timer if it was already running
		this.stopRequestTimer();
		this.stopConnectTimer();

		if(this.config.requestInterval > 0){
			this.log('info', "Starting requestTimer");
			// Create a reconnect timer to watch the socket. If disconnected try to connect.
			this.requestTimer = setInterval(function(){
				this.doRequestUpdate();
			}.bind(this), this.config.requestInterval);
		}
	}

	stopRequestTimer() {
		this.startConnectTimer(1000);

		if (this.requestTimer !== undefined) {
			this.log('info', "Stopping requestTimer");
			clearInterval(this.requestTimer);
			delete this.requestTimer;
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

	doConnect() {
		if(!this.waiting){
			this.waiting = true;

			this.system.emit('rest_get', 'http://' + this.config.host + '/json?action=connect&configid=0', this.handleReply.bind(this));
		}
	}

	doRequestUpdate() {
		if(!this.waiting){
			this.waiting = true;

			this.system.emit('rest_get', 'http://' + this.config.host + "/json?action=wait_for_config_events&configid=0&connectionid="+this.connectionID, this.handleReply.bind(this));
		}
	}

	handleReply(err, data, response) {
		var objJson = {};
		if(data.data){
			if(data.data.length){
				if (data.data.length > 0) {
					try {
						objJson = JSON.parse(data.data.toString());
						if(objJson['connectionid'] != undefined){
							this.connectionID = Number(objJson['connectionid']);
							if(this.connectionID){
								this.status(this.STATE_OK);
								this.stopConnectTimer();
								this.startRequestTimer(this.config.requestInterval);
								// Success
							}
						}
						else{
							for (let item of objJson){
								if(item['param_id'] == 'eParamID_DisplayTimecode'){
									let timecode = item['str_value'].split(':')
									this.updateVariable('TC_hours', timecode[0]);
									this.updateVariable('TC_min', timecode[1]);
									this.updateVariable('TC_sec', timecode[2]);
									this.updateVariable('TC_frames', timecode[3]);
								}
								else if(item['param_id'] == 'eParamID_TransportState'){
									this.updateVariable('State', item['str_value']);
									this.checkFeedbacks('transport_state');
								}
							}
						}
					} catch(error) {}
				}
			}
		}
		if (err) {
			this.log('error', 'Error connecting to KiPro');
			this.status(this.STATE_ERROR, err);
			this.stopRequestTimer();
			this.startConnectTimer(1000);
			this.waiting = false;
			return;
		}
		else{
			this.waiting = false;
			return;
		}
	}
}

exports = module.exports = instance;
