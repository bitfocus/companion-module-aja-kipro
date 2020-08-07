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
			this.config.requestInterval = 1;
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
			'format' : {label: 'Format Drive'},
			'eraseClip': {
				label: 'Erase Clip',
				options: [
					{
						type: 'textinput',
						label: 'Clip Name',
						id: 'idx',
						default: ''
					}
				]
			},
			'customTake': {
				label: 'Set Custom Take Number',
				options: [
					{
						type: 'number',
						label: 'Take Name',
						id: 'idx',
						min: 0,
						max: 999,
						default: 0
					}
				]
			},
			'load': {
				label: 'Load Clip By Name',
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
				cmd = 'StorageCommand&value=4&configid=0';
				break;
			case 'eraseClip':
				cmd = 'ClipToDelete&value=' + opt.idx + '&configid=0';
				break;
			case 'customTake':
				cmd = 'CustomTake&value=' + opt.idx + '&configid=0';
				break;
		}

		if(cmd !== null) {
			this.doCommand(cmd);
		}
	}

	init_presets() {
		var presets = [
			//Presets for Layers
			//Play
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
							state: 3
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(255,255,0),
							state: 15
						}
					}
				]
			},
			//Stop
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
			//Record
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
							state: 2
						}
					}
				]
			},
			//Next Clip
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
			//Previous Clip
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
			//Fast Forward
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
							bg: this.rgb(0,51,0),
							state: 4
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,102,0),
							state: 5
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,153,0),
							state: 6
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,204,0),
							state: 7
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 21
						}
					}
				]
			},
			//Rewind
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
							bg: this.rgb(0,42,0),
							state: 9 //1X Rev
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,84,0),
							state: 10 //2X Rev
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,126,0),
							state: 11 //4X Rev
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,168,0),
							state: 12 //8X Rev
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,210,0),
							state: 13 //16X Rev
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 22 //32X Rev
						}
					}
				]
			},
			//Step Forward
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
				],
				feedbacks: [
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 8
						}
					}
				]
			},
			//Step Backwards
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
				],
				feedbacks: [
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 14
						}
					}
				]
			},
			//Full TimeCode
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
			//TimeCode Hours
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
			//TimeCode Minutes
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
			//TimeCode Seconds
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
			//TimeCode Frames
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
			},
			//Stop and Format
			{
				category: 'Functions',
				label: 'Stop and format',
				bank: {
					style: 'text',
					text: 'Stop & Format',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false,
					relative_delay: true
				},
				actions: [
					{
						action: 'stop',
					},
					{
						action: 'stop',
						delay: 1
					},
					{
						action: 'format',
						delay: 1
					},
					{
						action: 'customTake',
						options:{
							idx: 0
						},
						delay: 1
					}
				],
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
						{ id: 0, label: "Unknown"},
						{ id: 1, label: "Idle"},
						{ id: 2, label: "Recording"},
						{ id: 3, label: "Forward"},
						{ id: 4, label: "Forward 2X"},
						{ id: 5, label: "Forward 4X"},
						{ id: 6, label: "Forward 8X"},
						{ id: 7, label: "Forward 16X"},
						{ id: 8, label: "Forward Step"},
						{ id: 9, label: "Reverse"},
						{ id: 10, label: "Reverse 2X"},
						{ id: 11, label: "Reverse 4X"},
						{ id: 12, label: "Reverse 8X"},
						{ id: 13, label: "Reverse 16X"},
						{ id: 14, label: "Reverse Step"},
						{ id: 15, label: "Paused"},
						{ id: 16, label: "Idle Error"},
						{ id: 17, label: "Record Error"},
						{ id: 18, label: "Play Error"},
						{ id: 19, label: "Pause Error"},
						{ id: 20, label: "Shutdown"},
						{ id: 21, label: "Forward 32X"},
						{ id: 22, label: "Reverse 32X"}
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
				case "Unknown":
					stateNum = 0;
					break;
				case "Idle":
					stateNum = 1;
					break;
				case "Recording":
					stateNum = 2;
					break;
				case "Forward":
					stateNum = 3;
					break;
				case "Forward 2X":
					stateNum = 4;
					break;
				case "Forward 4X":
					stateNum = 5;
					break;
				case "Forward 8X":
					stateNum = 6;
					break;
				case "Forward 16X":
					stateNum = 7;
					break;
				case "Forward 32X":
					stateNum = 21;
					break;
				case "Forward Step":
					stateNum = 8;
					break;
				case "Reverse":
					stateNum = 9;
					break;
				case "Reverse 2X":
					stateNum = 10;
					break;
				case "Reverse 4X":
					stateNum = 11;
					break;
				case "Reverse 8X":
					stateNum = 12;
					break;
				case "Reverse 16X":
					stateNum = 13;
					break;
				case "Reverse 32X":
					stateNum = 22;
					break;
				case "Reverse Step":
					stateNum = 14;
					break;
				case "Paused":
					stateNum = 15;
					break;
				case "Idle Error":
					stateNum = 16;
					break;
				case "Record Error":
					stateNum = 17;
					break;
				case "Play Error":
					stateNum = 18;
					break;
				case "Pause Error":
					stateNum = 19;
					break;
				case "Shutdown":
					stateNum = 20;
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
			'State':'Idle',
			'CurrentClip':"",
			'MediaAvailable':"0%",
			'SystemName': "AJA KiPro"
		}

		this.setVariable('TC_hours', '00');
		this.setVariable('TC_min', '00');
		this.setVariable('TC_sec', '00');
		this.setVariable('TC_frames', '00');
		this.setVariable('State', 'Idle');
		this.setVariable('CurrentClip', '');
		this.setVariable('MediaAvailable', "0%");
		this.setVariable('SystemName', "AJA KiPro");

		var variables = [
			{label: 'TimeCode Hours',		name:  'TC_hours'},
			{label: 'TimeCode Minutes',		name:  'TC_min'},
			{label: 'TimeCode Seconds',		name:  'TC_sec'},
			{label: 'TimeCode Frames',		name:  'TC_frames'},
			{label: 'State',				name:  'State'},
			{label: 'Current Clip',			name:  'CurrentClip'},
			{label: 'Media Available',		name:  'MediaAvailable'},
			{label: 'System Name',			name:  'SystemName'}
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

	doCommand(cmd) {
		this.system.emit('rest_get', 'http://' + this.config.host + '/config?action=set&paramid=eParamID_' + cmd, function(err, data, response) {
			if(err) {
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
							if(objJson['configevents'] != undefined){ //This will pick up initial values on connection
								for (let item of objJson['configevents']){
									if('eParamID_DisplayTimecode' in item){
										let timecode = item['eParamID_DisplayTimecode'].split(':')
										this.updateVariable('TC_hours', timecode[0]);
										this.updateVariable('TC_min', timecode[1]);
										this.updateVariable('TC_sec', timecode[2]);
										this.updateVariable('TC_frames', timecode[3]);
									}

									if('eParamID_TransportCurrentSpeed' in item){
										switch (Number(item['eParamID_TransportCurrentSpeed'])) {
											case 2:
												this.updateVariable('State', "Forward 2X");
												break;
											case 4:
												this.updateVariable('State', "Forward 4X");
												break;
											case 8:
												this.updateVariable('State', "Forward 8X");
												break;
											case 16:
												this.updateVariable('State', "Forward 16X");
												break;
											case 32:
												this.updateVariable('State', "Forward 32X");
												break;
											case -1:
												this.updateVariable('State', "Reverse");
												break;
											case -2:
												this.updateVariable('State', "Reverse 2X");
												break;
											case -4:
												this.updateVariable('State', "Reverse 4X");
												break;
											case -8:
												this.updateVariable('State', "Reverse 8X");
												break;
											case -16:
												this.updateVariable('State', "Reverse 16X");
												break;
											case -32:
												this.updateVariable('State', "Reverse 32X");
												break;
										}
										this.checkFeedbacks('transport_state');
									}

									if('eParamID_TransportState' in item){
										switch (Number(item['eParamID_TransportState'])) {
											//Cases 4-7 and 9-13 are handled by eParamID_TransportCurrentSpeed
											case 0:
												this.updateVariable('State', "Unknown");
												break;
											case 1:
												this.updateVariable('State', "Idle");
												break;
											case 2:
												this.updateVariable('State', "Recording");
												break;
											case 3:
												this.updateVariable('State', "Forward");
												break;
											case 8:
												this.updateVariable('State', "Forward Step");
												break;
											case 14:
												this.updateVariable('State', "Reverse Step");
												break;
											case 15:
												this.updateVariable('State', "Paused");
												break;
											case 16:
												this.updateVariable('State', "Idle Error");
												break;
											case 17:
												this.updateVariable('State', "Record Error");
												break;
											case 18:
												this.updateVariable('State', "Play Error");
												break;
											case 19:
												this.updateVariable('State', "Pause Error");
												break;
											case 20:
												this.updateVariable('State', "Shutdown");
												break;
										}
										this.checkFeedbacks('transport_state');
									}

									if('eParamID_CurrentClip'in item){
										this.updateVariable('CurrentClip', item['eParamID_CurrentClip']);
									}

									if('eParamID_CurrentMediaAvailable' in item){
										this.updateVariable('MediaAvailable', item['eParamID_CurrentMediaAvailable']+"%");
									}

									if('eParamID_SysName' in item){
										this.updateVariable('SystemName', item['eParamID_SysName']);
									}
								}
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
								else if(item['param_id'] == 'eParamID_TransportCurrentSpeed'){
									switch (Number(item['str_value'])) {
										case 2:
											this.updateVariable('State', "Forward 2X");
											break;
										case 4:
											this.updateVariable('State', "Forward 4X");
											break;
										case 8:
											this.updateVariable('State', "Forward 8X");
											break;
										case 16:
											this.updateVariable('State', "Forward 16X");
											break;
										case 32:
											this.updateVariable('State', "Forward 32X");
											break;
										case -1:
											this.updateVariable('State', "Reverse");
											break;
										case -2:
											this.updateVariable('State', "Reverse 2X");
											break;
										case -4:
											this.updateVariable('State', "Reverse 4X");
											break;
										case -8:
											this.updateVariable('State', "Reverse 8X");
											break;
										case -16:
											this.updateVariable('State', "Reverse 16X");
											break;
										case -32:
											this.updateVariable('State', "Reverse 32X");
											break;
									}
									this.checkFeedbacks('transport_state');
								}
								else if(item['param_id'] == 'eParamID_TransportState'){
									switch (Number(item['int_value'])) {
										//Cases 4-7 and 9-13 are handled by eParamID_TransportCurrentSpeed
										case 0:
											this.updateVariable('State', "Unknown");
											break;
										case 1:
											this.updateVariable('State', "Idle");
											break;
										case 2:
											this.updateVariable('State', "Recording");
											break;
										case 3:
											this.updateVariable('State', "Forward");
											break;
										case 8:
											this.updateVariable('State', "Forward Step");
											break;
										case 14:
											this.updateVariable('State', "Reverse Step");
											break;
										case 15:
											this.updateVariable('State', "Paused");
											break;
										case 16:
											this.updateVariable('State', "Idle Error");
											break;
										case 17:
											this.updateVariable('State', "Record Error");
											break;
										case 18:
											this.updateVariable('State', "Play Error");
											break;
										case 19:
											this.updateVariable('State', "Pause Error");
											break;
										case 20:
											this.updateVariable('State', "Shutdown");
											break;
									}
									this.checkFeedbacks('transport_state');
								}
								else if(item['param_id'] == 'eParamID_CurrentClip'){
									this.updateVariable('CurrentClip', item['str_value']);
								}
								else if(item['param_id'] == 'eParamID_CurrentMediaAvailable'){
									this.updateVariable('MediaAvailable', item['int_value']+"%");
								}
								else if(item['param_id'] == 'eParamID_SysName'){
									this.updateVariable('SystemName', item['str_value']);
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
