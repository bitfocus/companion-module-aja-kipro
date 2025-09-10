const { InstanceStatus } = require('@companion-module/base')

const Client  = require('node-rest-client').Client;

module.exports = {
	startConnectTimer() {
		let timeout = 5000;
	
		// Stop the timer if it was already running
		this.stopConnectTimer();
	
		this.log('debug', "Starting connection timer");
		// Create a reconnect timer to watch the socket. If disconnected try to connect.
		this.connectTimer = setInterval(function() { //Auth Enabled
			if (this.config.password && this.config.password !== "") {
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
	},

	stopConnectTimer() {
		if (this.connectTimer !== undefined) {
			this.log('debug', "Stopping connection timer");
			clearInterval(this.connectTimer);
			delete this.connectTimer;
		}
	},

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
	},

	stopRequestTimer() {
		if (this.requestTimer !== undefined) {
			this.log('debug', "Stopping request timer");
			clearInterval(this.requestTimer);
			delete this.requestTimer;
		}
	},

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
	
			let client = new Client();
	
			client.post('http://' + this.config.host + '/authenticator/login', args, function (data, response) {
				this.handleReply(null, { data: data, response: response })
			}.bind(this)).on('error', function(error) {
				this.handleReply(true,{ error: error })
			}.bind(this));
		}
	},

	handleReply(err, data){
		let objJson = {};
	
		if (err) {
			if(data['error']['code'] == "HPE_UNEXPECTED_CONTENT_LENGTH"){
				this.log('warn', 'Non-compliant header recieved. Polling disabled. See help file for details');
				this.updateStatus(InstanceStatus.Ok, "No Polling");
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
				this.updateStatus(InstanceStatus.ConnectionFailure, err);
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
					this.updateStatus(InstanceStatus.ConnectionFailure, err);
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
	},

	processCurrentSpeed(speed){
		switch (speed) {
			case 2:
				this.state['TransportState'] = 'FORWARD_2X';
				break;
			case 4:
				this.state['TransportState'] = 'FORWARD_4X';
				break;
			case 8:
				this.state['TransportState'] = 'FORWARD_8X';
				break;
			case 16:
				this.state['TransportState'] = 'FORWARD_16X';
				break;
			case 32:
				this.state['TransportState'] = 'FORWARD_32X';
				break;
			case -1:
				this.state['TransportState'] = 'REVERSE';
				break;
			case -2:
				this.state['TransportState'] = 'REVERSE_2X';
				break;
			case -4:
				this.state['TransportState'] = 'REVERSE_4X';
				break;
			case -8:
				this.state['TransportState'] = 'REVERSE_8X';
				break;
			case -16:
				this.state['TransportState'] = 'REVERSE_16X';
				break;
			case -32:
				this.state['TransportState'] = 'REVERSE_32X';
				break;
		}
	
		this.checkVariables();
		this.checkFeedbacks();
	
		return 1;
	},
	
	processCurrentState(state){
		switch (state) {
			//Cases 3-7 and 9-13 are handled by eParamID_TransportCurrentSpeed
			case 0:
				this.state['TransportState'] = 'UNKNOWN';
				break;
			case 1:
				this.state['TransportState'] = 'IDLE';
				break;
			case 2:
				this.state['TransportState'] = 'RECORDING';
				break;
			case 3:
				this.state['TransportState'] = 'FORWARD';
				break;
			case 8:
				this.state['TransportState'] = 'FORWARD_STEP';
				break;
			case 14:
				this.state['TransportState'] = 'REVERSE_STEP';
				break;
			case 15:
				this.state['TransportState'] = 'PAUSED';
				break;
			case 16:
				this.state['TransportState'] = 'IDLE_ERROR';
				break;
			case 17:
				this.state['TransportState'] = 'RECORD_ERROR';
				break;
			case 18:
				this.state['TransportState'] = 'PLAY_ERROR';
				break;
			case 19:
				this.state['TransportState'] = 'PAUSE_ERROR';
				break;
			case 20:
				this.state['TransportState'] = 'SHUTDOWN';
				break;
		}
	
		this.checkVariables();
		this.checkFeedbacks();
		
		return 1;
	},
	
	processTimecode(fullTimecode){
		let timecode = fullTimecode.split(/:|;/)

		this.state['TC_hours'] = timecode[0];
		this.state['TC_min'] = timecode[1];
		this.state['TC_sec'] = timecode[2];
		this.state['TC_frames'] = timecode[3];

		this.checkVariables();
		this.checkFeedbacks();
	
		return 1;
	},
	
	processLogin(loginStatus, headers){
		if (loginStatus === "success") {
			this.authenticated = true;
			this.authToken = headers['set-cookie'][0];
			this.connectionID = 0;
			this.log('debug', 'Authenticated');
		}
		else if (loginStatus === "Login Failed - Passwords did not match") {
			this.updateStatus(InstanceStatus.ConnectionFailure, "Password does not match")
			this.authenticated = false;
			this.authToken = "";
			this.connectionID = 0;
			this.log('error', 'Password does not match');
		}
		else{
			this.updateStatus(InstanceStatus.ConnectionFailure, "Authentication Error")
			this.authenticated = false;
			this.authToken = "";
			this.connectionID = 0;
			this.log('error', 'Authentication Error');
		}
		return 1;
	},
	
	processConnection(objJson){
		this.connectionID = Number(objJson['connectionid']);
		if (this.connectionID) {
			this.updateStatus(InstanceStatus.Ok);
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
							this.state['CurrentClip'] = item['eParamID_CurrentClip'];
						}
	
						if ('eParamID_CurrentMediaAvailable' in item) {
							this.state['MediaAvailable'] = item['eParamID_CurrentMediaAvailable']+'%';
						}
	
						if ('eParamID_SysName' in item) {
							this.state['SystemName'] = item['eParamID_SysName'];
						}
					}
				}
			}
		}
		else{
			this.log('error', 'Connection Error');
			this.updateStatus(InstanceStatus.ConnectionFailure);
			this.authenticated = false;
			this.authToken = "";
			this.connectionID = 0;
			this.stopRequestTimer();
			this.startConnectTimer();
			this.waiting = false;
		}
		return 1;
	},
	
	processClips(clips){
		this.availableClips = [];
		for (let clip of clips) {
			this.availableClips.push({id:clip['clipname'], label:clip['clipname']});
		}
		this.actions();
		return 1;
	},
	
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
					case 'eParamID_MediaState':
						this.state['MediaState'] = item['str_value'];
						this.checkVariables();
						this.checkFeedbacks();
						break;
					case 'eParamID_CurrentClip':
						this.state['CurrentClip'] = item['str_value']
						break;
					case 'eParamID_CurrentMediaAvailable':
						this.state['MediaAvailable'] = item['int_value']+"%";
						break;
					case 'eParamID_SysName':
						this.state['SystemName'] = item['str_value']
						break;
					case 'eParamID_MediaUpdated':
						this.doGetClips();
						break;
				}
			}
		}
		return 1;
	},

	doCommand(cmd) {
		let args = {
			headers: {}
		};
	
		if (this.config.password !== "") {
			args.headers["Cookie"] = this.authToken;
		}
	
		let client = new Client();
	
		client.get('http://' + this.config.host + '/config?action=set&paramid=eParamID_' + cmd, args, function (data, response) {
			this.handleReply(null, { data: data, response: response })
		}.bind(this)).on('error', function(error) {
			this.handleReply(true,{ error: error })
		}.bind(this));
	},
	
	doConnect() {
		if (!this.waiting) {
			this.waiting = true;
	
			let args = {
				headers: {}
			};
		
			if (this.authenticated) {
				args.headers["Cookie"] = this.authToken;
			}
		
			let client = new Client();
		
			client.get('http://' + this.config.host + '/json?action=connect&configid=0', args, function (data, response) {
				this.handleReply(null, { data: data, response: response })
			}.bind(this)).on('error', function(error) {
				this.handleReply(true,{ error: error })
			}.bind(this));
		}
	},
	
	doGetClips() {
		let args = {
			headers: {}
		};

		if (this.authenticated) {
			args.headers["Cookie"] = this.authToken;
		}
	
		let client = new Client();
	
		client.get('http://' + this.config.host + '/clips?action=get_clips', args, function (data, response) {
			this.handleReply(null, { data: data, response: response })
		}.bind(this)).on('error', function(error) {
			this.handleReply(true,{ error: error })
		}.bind(this));
	},
	
	doRequestUpdate() {
		if (!this.waiting) {
			this.waiting = true;

			let args = {
				headers: {}
			};
	
			if (this.authenticated) {
				args.headers["Cookie"] = this.authToken;
			}
		
			let client = new Client();
		
			client.get('http://' + this.config.host + '/json?action=wait_for_config_events&configid=0&connectionid='+this.connectionID, args, function (data, response) {
				this.handleReply(null, { data: data, response: response })
			}.bind(this)).on('error', function(error) {
				this.handleReply(true,{ error: error })
			}.bind(this));
		}
	}
}