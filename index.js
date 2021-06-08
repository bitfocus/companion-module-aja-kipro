const instance_skel = require('../../instance_skel');
var Client  = require('node-rest-client').Client;
const upgradeScripts = require('./upgrades')

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config);

		this.waiting = false;
		this.connectionID = 0;
		this.authenticated = false;
		this.authToken = "";
		this.availableClips = [];

		this.state = {
			'TransportState': 0
		}

		this.t_states = {
			UNKNOWN:"Unknown",
			IDLE:"Idle",
			RECORDING:"Recording",
			FORWARD:"Forward",
			FORWARD_2X:"Forward 2X",
			FORWARD_4X:"Forward 4X",
			FORWARD_8X:"Forward 8X",
			FORWARD_16X:"Forward 16X",
			FORWARD_32X:"Forward 32X",
			FORWARD_STEP:"Forward Step",
			REVERSE:"Reverse",
			REVERSE_2X:"Reverse 2X",
			REVERSE_4X:"Reverse 4X",
			REVERSE_8X:"Reverse 8X",
			REVERSE_16X:"Reverse 16X",
			REVERSE_32X:"Reverse 32X",
			REVERSE_STEP:"Reverse Step",
			PAUSED:"Paused",
			IDLE_ERROR:"Idle Error",
			RECORD_ERROR:"Record Error",
			PLAY_ERROR:"Play Error",
			PAUSE_ERROR:"Pause Error",
			SHUTDOWN:"Shutdown"
		}

		this.actions(); // export actions
	}

	static GetUpgradeScripts() {
		return upgradeScripts
	}

	updateConfig(config) {
		var reconnect = false;

		if ((config.host != this.config.host) || (config.password != this.config.password) || (config.polling != this.config.polling) || (config.pollingRate != this.config.pollingRate)) {
			reconnect = true;
		}

		this.config = config;

		if ((reconnect) && (this.config.host != undefined) && (this.config.host != "")){
			this.stopRequestTimer();
			this.stopConnectTimer();

			this.initVariables();
			this.checkFeedbacks('transport_state');

			this.startConnectTimer();
			this.status(this.STATE_UNKNOWN);
		}
	}

	init() {
		this.status(this.STATE_UNKNOWN);

		this.initVariables();
		this.init_presets();
		this.init_feedbacks();

		if((this.config.host != undefined) && (this.config.host != "")){
			this.startConnectTimer();
		}
		this.checkFeedbacks('transport_state');

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
				width: 12,
				regex: this.REGEX_IP,
				required: true
			},
			{
				type: 'text',
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
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Authentication',
				value: 'Leave password blank for no authentication'
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 12,
			}
		]
	}

	destroy() {
		this.debug("destroy");

		this.stopRequestTimer();
		this.stopConnectTimer();
	}

	actions(system) {
		this.setActions({
		//this.system.emit('instance_actions', this.id, {
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
				label: 'Erase Clip By Name',
				options: [
					{
						type: 'textinput',
						label: 'Clip Name',
						id: 'idx',
						default: ''
					}
				]
			},
			'eraseClipByDrop': {
				label: 'Erase Clip By List',
				options: [
					{
						type: 'dropdown',
						label: 'Clip Name',
						id: 'idx',
						default: '',
						choices: this.availableClips
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
			'loadByDrop': {
				label: 'Load Clip By List',
				options: [
					{
						type: 'dropdown',
						label: 'Clip',
						id: 'idx',
						default: '',
						choices: this.availableClips
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
			'setTimecode': {
				label: 'Set Timecode Value',
				options: [
					{
						type: 'dropdown',
						label: 'Timecode',
						id: 'idx',
						default: 0,
						choices: [
							{id:"0", label:"00:00:00:00"},
							{id:"1", label:"01:00:00:00"},
							{id:"2", label:"02:00:00:00"},
							{id:"3", label:"03:00:00:00"},
							{id:"4", label:"04:00:00:00"},
							{id:"5", label:"05:00:00:00"},
							{id:"6", label:"06:00:00:00"},
							{id:"7", label:"07:00:00:00"},
							{id:"8", label:"08:00:00:00"},
							{id:"9", label:"09:00:00:00"},
							{id:"10", label:"10:00:00:00"},
							{id:"11", label:"11:00:00:00"},
							{id:"12", label:"12:00:00:00"},
							{id:"13", label:"13:00:00:00"},
							{id:"14", label:"14:00:00:00"},
							{id:"15", label:"15:00:00:00"},
							{id:"16", label:"16:00:00:00"},
							{id:"17", label:"17:00:00:00"},
							{id:"18", label:"18:00:00:00"},
							{id:"19", label:"19:00:00:00"},
							{id:"20", label:"20:00:00:00"},
							{id:"21", label:"21:00:00:00"},
							{id:"22", label:"22:00:00:00"},
							{id:"23", label:"23:00:00:00"},
						]
					}
				]
			},
			'setMediaState': {
				label: 'Media State',
				options: [
					{
						type: 'dropdown',
						label: 'State',
						id: 'idx',
						choices: [
							{id: '0', label: 'Play/Record'},
							{id: '1', label: 'LAN'}
						]
					}
				]
			}
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
			case 'loadByDrop':
				cmd = 'GoToClip&value=' + opt.idx;
				break;
			case 'loop':
				cmd = 'LoopPlay&value=' + opt.idx;
				break;
			case 'format':
				cmd = 'StorageCommand&value=4&configid=0';
				break;
			case 'eraseClip':
			case 'eraseClipByDrop':
				cmd = 'ClipToDelete&value=' + opt.idx + '&configid=0';
				break;
			case 'customTake':
				cmd = 'CustomTake&value=' + opt.idx + '&configid=0';
				break;
			case 'setTimecode':
				cmd = 'TimecodeValue&value=' + opt.idx;
				break;
			case 'setMediaState':
				cmd = 'MediaState&value=' + opt.idx;
				break;
		}

		if (cmd !== null) {
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
							state: 'FORWARD'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(255,255,0),
							state: 'PAUSED'
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
							state: 'IDLE'
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
							state: 'RECORDING'
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
							state: 'FORWARD_2X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,102,0),
							state: 'FORWARD_4X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,153,0),
							state: 'FORWARD_8X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,204,0),
							state: 'FORWARD_16X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 'FORWARD_32X'
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
							state: 'REVERSE'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,84,0),
							state: 'REVERSE_2X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,126,0),
							state: 'REVERSE_4X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,168,0),
							state: 'REVERSE_8X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,210,0),
							state: 'REVERSE_16X'
						}
					},
					{
						type: 'transport_state',
						options: {
							fg: this.rgb(0,0,0),
							bg: this.rgb(0,255,0),
							state: 'REVERSE_32X'
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
							state: 'FORWARD_STEP'
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
							state: 'REVERSE_STEP'
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
						delay: 500
					},
					{
						action: 'customTake',
						options:{
							idx: "0"
						},
						delay: 200
					},
					{
						action: 'format',
						delay: 200
					}
				],
			},
			//Reset Timecode and Record
			{
				category: 'Functions',
				label: 'Reset Timecode and Record',
				bank: {
					style: 'text',
					text: 'Reset and Record',
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false,
					relative_delay: true
				},
				actions: [
					{
						action: 'setTimecode',
						options:{
							idx: "1"
						},
					},
					{
						action: 'setTimecode',
						delay: 10,
						options:{
							idx: "0"
						},
					},
					{
						action: 'rec',
						delay: 10
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
					choices: Object.keys(this.t_states).map(i => { return {id: i, label: this.t_states[i]} })
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
		if (feedback.type === 'transport_state') {
			if (this.state['TransportState'] === feedback.options.state) {
				return { color: feedback.options.fg, bgcolor: feedback.options.bg};
			}
		}
	}

	initVariables() {
		var variables = [
			{label: 'TimeCode Hours',		name:  'TC_hours'},
			{label: 'TimeCode Minutes',		name:  'TC_min'},
			{label: 'TimeCode Seconds',		name:  'TC_sec'},
			{label: 'TimeCode Frames',		name:  'TC_frames'},
			{label: 'Transport State',		name:  'TransportState'},
			{label: 'Current Clip',			name:  'CurrentClip'},
			{label: 'Media Available',		name:  'MediaAvailable'},
			{label: 'System Name',			name:  'SystemName'}
		];

		this.setVariableDefinitions(variables);

		this.setVariable('TC_hours', '00');
		this.setVariable('TC_min', '00');
		this.setVariable('TC_sec', '00');
		this.setVariable('TC_frames', '00');
		this.setVariable('TransportState', 'Unknown');
		this.setVariable('CurrentClip', 'N/A');
		this.setVariable('MediaAvailable', "0%");
		this.setVariable('SystemName', "N/A");

		this.state['TransportState'] = 0;
	}

	startConnectTimer() {
		var timeout = 5000;

		// Stop the timer if it was already running
		this.stopConnectTimer();

		this.log('debug', "Starting connection timer");
		// Create a reconnect timer to watch the socket. If disconnected try to connect.
		this.connectTimer = setInterval(function() { //Auth Enabled
			if (this.config.password !== "") {
				if (!this.authenticated) { //Not Authenticated so send password
					this.doAuthenticate();
				}
				else{ //Authenticated so connect
					this.doConnect();
				}
			}
			else { //Auth Disabled
				this.doConnect();
			}
		}.bind(this), timeout);
	}

	stopConnectTimer() {
		if (this.connectTimer !== undefined) {
			this.log('debug', "Stopping connection timer");
			clearInterval(this.connectTimer);
			delete this.connectTimer;
		}

	}

	startRequestTimer() {
		// Stop the timer if it was already running
		this.stopRequestTimer();
		this.stopConnectTimer();

		let refreshRate = 50000; //Keep connection alive for authentication if polling is disabled

		if (this.config.polling) {
			refreshRate = this.config.pollingRate;
		}

		this.log('debug', "Starting request timer");
		this.requestTimer = setInterval(function() {
			this.doRequestUpdate();
		}.bind(this), refreshRate);
	}

	stopRequestTimer() {
		if (this.requestTimer !== undefined) {
			this.log('debug', "Stopping request timer");
			clearInterval(this.requestTimer);
			delete this.requestTimer;
		}
	}

	doCommand(cmd) {
		var extraHeadders = {}

		if (this.config.password !== "") {
			extraHeadders["Cookie"] = this.authToken;
		}

		this.system.emit('rest_get', 'http://' + this.config.host + '/config?action=set&paramid=eParamID_' + cmd, this.handleReply.bind(this), extraHeadders);
	}

	doAuthenticate() {
		if (!this.waiting) {
			this.waiting = true;

			let data = "password_provided="+this.config.password;

			var args = {
				data: data,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"User-Agent": "curl/7.64.1",
					"Accept": "*/*"
				}
			};

			var client = new Client();

			client.post('http://' + this.config.host + '/authenticator/login', args, function (data, response) {
				this.handleReply(null, { data: data, response: response })
			}.bind(this)).on('error', function(error) {
				this.handleReply(true,{ error: error })
			}.bind(this));
		}
	}

	doConnect() {
		if (!this.waiting) {
			this.waiting = true;

			var extraHeadders = {}

			if (this.authenticated) {
				extraHeadders["Cookie"] = this.authToken;
			}

			this.system.emit('rest_get', 'http://' + this.config.host + '/json?action=connect&configid=0', this.handleReply.bind(this), extraHeadders);
		}
	}

	doGetClips() {
		var extraHeadders = {}

		if (this.authenticated) {
			extraHeadders["Cookie"] = this.authToken;
		}

		this.system.emit('rest_get', 'http://' + this.config.host + '/clips?action=get_clips', this.handleReply.bind(this), extraHeadders);
	}

	doRequestUpdate() {
		if (!this.waiting) {
			this.waiting = true;

			var extraHeadders = {}

			if (this.authenticated) {
				extraHeadders["Cookie"] = this.authToken;
			}

			this.system.emit('rest_get', 'http://' + this.config.host + "/json?action=wait_for_config_events&configid=0&connectionid="+this.connectionID, this.handleReply.bind(this), extraHeadders);
		}
	}

	handleReply(err, data){
		var objJson = {};

		if (err) {
			if(data['error']['code'] == "HPE_UNEXPECTED_CONTENT_LENGTH"){
				this.log('warn', 'Non-compliant header recieved. Polling disabled. See help file for details');
				this.status(this.STATE_OK, "No Polling");
				this.config.polling = false;
				this.saveConfig();
				this.authenticated = false;
				this.authToken = "";
				this.connectionID = 0;
				this.stopRequestTimer();
				this.stopConnectTimer();
				this.waiting = false;
				return;
			}
			else{
				this.log('error', 'Error connecting to KiPro');
				this.status(this.STATE_ERROR, err);
				this.authenticated = false;
				this.authToken = "";
				this.connectionID = 0;
				this.stopRequestTimer();
				this.startConnectTimer();
				this.waiting = false;
				return;
			}
		}
		else {
			if (data.data) {
				if (data.response.statusCode === 200) {
					if (data.data.length) {
						if (data.data.length > 0) {
							try {
								objJson = JSON.parse(data.data.toString());
								//If connection response
								if (objJson['connectionid'] != undefined) {
									this.processConnection(objJson);
								}
								//Clips response
								else if (objJson['clips'] != undefined) {
									this.processClips(objJson['clips']);
								}
								//login Response
								else if (objJson['login'] !== undefined) {
									this.processLogin(objJson['login'], data.response.headers);
								}
								//Poll response
								else if (this.config.polling) { //Polling is active so update the variables
									this.processPollingResponse(objJson);
								}
							}
							catch(error) {}
						}
					}
				}
				else {
					this.log('error', 'Status '+data.response.statusCode);
					this.status(this.STATE_ERROR, err);
					this.authenticated = false;
					this.authToken = "";
					this.connectionID = 0;
					this.stopRequestTimer();
					this.startConnectTimer();
					this.waiting = false;
					return;
				}
			}
			this.waiting = false;
			return;
		}
	}

	processCurrentSpeed(speed){
		var update = false;
		switch (speed) {
			case 2:
				this.state['TransportState'] = 'FORWARD_2X';
				update = true;
				break;
			case 4:
				this.state['TransportState'] = 'FORWARD_4X';
				update = true;
				break;
			case 8:
				this.state['TransportState'] = 'FORWARD_8X';
				update = true;
				break;
			case 16:
				this.state['TransportState'] = 'FORWARD_16X';
				update = true;
				break;
			case 32:
				this.state['TransportState'] = 'FORWARD_32X';
				update = true;
				break;
			case -1:
				this.state['TransportState'] = 'REVERSE';
				update = true;
				break;
			case -2:
				this.state['TransportState'] = 'REVERSE_2X';
				update = true;
				break;
			case -4:
				this.state['TransportState'] = 'REVERSE_4X';
				update = true;
				break;
			case -8:
				this.state['TransportState'] = 'REVERSE_8X';
				update = true;
				break;
			case -16:
				this.state['TransportState'] = 'REVERSE_16X';
				update = true;
				break;
			case -32:
				this.state['TransportState'] = 'REVERSE_32X';
				update = true;
				break;
		}
		if(update){
			this.setVariable('TransportState', this.t_states[this.state['TransportState']])
			this.checkFeedbacks('transport_state');
		}
		return 1;
	}

	processCurrentState(state){
		var update = false;
		switch (state) {
			//Cases 3-7 and 9-13 are handled by eParamID_TransportCurrentSpeed
			case 0:
				this.state['TransportState'] = 'UNKNOWN';
				update = true;
				break;
			case 1:
				this.state['TransportState'] = 'IDLE';
				update = true;
				break;
			case 2:
				this.state['TransportState'] = 'RECORDING';
				update = true;
				break;
			case 3:
				this.state['TransportState'] = 'FORWARD';
				update = true;
				break;
			case 8:
				this.state['TransportState'] = 'FORWARD_STEP';
				update = true;
				break;
			case 14:
				this.state['TransportState'] = 'REVERSE_STEP';
				update = true;
				break;
			case 15:
				this.state['TransportState'] = 'PAUSED';
				update = true;
				break;
			case 16:
				this.state['TransportState'] = 'IDLE_ERROR';
				update = true;
				break;
			case 17:
				this.state['TransportState'] = 'RECORD_ERROR';
				update = true;
				break;
			case 18:
				this.state['TransportState'] = 'PLAY_ERROR';
				update = true;
				break;
			case 19:
				this.state['TransportState'] = 'PAUSE_ERROR';
				update = true;
				break;
			case 20:
				this.state['TransportState'] = 'SHUTDOWN';
				update = true;
				break;
		}
		if(update){
			this.setVariable('TransportState', this.t_states[this.state['TransportState']])
			this.checkFeedbacks('transport_state');
		}
		return 1;
	}

	processTimecode(fullTimecode){
		let timecode = fullTimecode.split(':')
		this.setVariable('TC_hours', timecode[0]);
		this.setVariable('TC_min', timecode[1]);
		this.setVariable('TC_sec', timecode[2]);
		this.setVariable('TC_frames', timecode[3]);
		return 1;
	}

	processLogin(loginStatus, headers){
		if (loginStatus === "success") {
			this.authenticated = true;
			this.authToken = headers['set-cookie'][0];
			this.connectionID = 0;
			this.log('debug', 'Authenticated');
		}
		else if (loginStatus === "Login Failed - Passwords did not match") {
			this.status(this.STATE_ERROR);
			this.authenticated = false;
			this.authToken = "";
			this.connectionID = 0;
			this.log('error', 'Password does not match');
		}
		else{
			this.status(this.STATE_ERROR);
			this.authenticated = false;
			this.authToken = "";
			this.connectionID = 0;
			this.log('error', 'Authentication Error');
		}
		return 1;
	}

	processConnection(objJson){
		this.connectionID = Number(objJson['connectionid']);
		if (this.connectionID) {
			this.status(this.STATE_OK);
			this.log('debug', "Connected");
			this.doGetClips();
			this.stopConnectTimer();
			this.startRequestTimer();
			// Success

			if (this.config.polling) { //Polling is active so update the variables
				if (objJson['configevents'] != undefined) { //This will pick up initial values on connection
					for (let item of objJson['configevents']) {
						if ('eParamID_DisplayTimecode' in item) {
							this.processTimecode(item['eParamID_DisplayTimecode']);
						}

						if ('eParamID_TransportCurrentSpeed' in item) {
							this.processCurrentSpeed(Number(item['eParamID_TransportCurrentSpeed']));
						}

						if ('eParamID_TransportState' in item) {
							this.processCurrentState(Number(item['eParamID_TransportState']));
						}

						if ('eParamID_CurrentClip'in item) {
							this.setVariable('CurrentClip', item['eParamID_CurrentClip']);
						}

						if ('eParamID_CurrentMediaAvailable' in item) {
							this.setVariable('MediaAvailable', item['eParamID_CurrentMediaAvailable']+"%");
						}

						if ('eParamID_SysName' in item) {
							this.setVariable('SystemName', item['eParamID_SysName']);
						}
					}
				}
			}
		}
		else{
			this.log('error', 'Connection Error');
			this.status(this.STATE_ERROR);
			this.authenticated = false;
			this.authToken = "";
			this.connectionID = 0;
			this.stopRequestTimer();
			this.startConnectTimer();
			this.waiting = false;
		}
		return 1;
	}

	processClips(clips){
		this.availableClips = [];
		for (let clip of clips) {
			this.availableClips.push({id:clip['clipname'], label:clip['clipname']});
		}
		this.actions();
		return 1;
	}

	processPollingResponse(objJson){
		for (let item of objJson) {
			if(item['param_id'] != undefined){
				switch (item['param_id']) {
					case 'eParamID_DisplayTimecode':
						this.processTimecode(item['str_value']);
						break;
					case 'eParamID_TransportCurrentSpeed':
						this.processCurrentSpeed(Number(item['str_value']));
						break;
					case 'eParamID_TransportState':
						this.processCurrentState(Number(item['int_value']));
						break;
					case 'eParamID_CurrentClip':
						this.setVariable('CurrentClip', item['str_value']);
						break;
					case 'eParamID_CurrentMediaAvailable':
						this.setVariable('MediaAvailable', item['int_value']+"%");
						break;
					case 'eParamID_SysName':
						this.setVariable('SystemName', item['str_value']);
						break;
					case 'eParamID_MediaUpdated':
						this.doGetClips();
						break;
				}
			}
		}
		return 1;
	}
}

exports = module.exports = instance;
