const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')

const UpgradeScripts = require('./src/upgrades')

const configFields = require('./src/configFields');
const api = require('./src/api');
const actions = require('./src/actions');
const variables = require('./src/variables');
const feedbacks = require('./src/feedbacks');
const presets = require('./src/presets');

class AjaKiProInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...configFields,
			...api,
			...actions,
			...variables,
			...feedbacks,
			...presets,			
		})

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
	}

	async init(config) {
		this.configUpdated(config);
	}

	async configUpdated(config) {
		this.config = config

		this.initActions();
		this.initFeedbacks();
		this.initVariables();
		this.initPresets();

		this.checkVariables();
		this.checkFeedbacks();

		this.stopRequestTimer();
		this.stopConnectTimer();

		this.startConnectTimer();
		this.updateStatus(InstanceStatus.Connecting);
	}

	async destroy() {
		//close out any connections
		this.stopRequestTimer();
		this.stopConnectTimer();

		this.debug('destroy', this.id);
	}
}

runEntrypoint(AjaKiProInstance, UpgradeScripts);