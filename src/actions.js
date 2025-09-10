module.exports = {
	initActions() {
		let self = this // required to have reference to outer `this`
		let actions = {}

		let cmd = null

		actions.play = {
			name: 'Play',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=1'
				self.doCommand(cmd)
			},
		}

		actions.stop = {
			name: 'Stop',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=4'
				self.doCommand(cmd)
			},
		}

		actions.rec = {
			name: 'Record',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=3'
				self.doCommand(cmd)
			},
		}

		actions.next = {
			name: 'Next Clip',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=9'
				self.doCommand(cmd)
			},
		}

		actions.prv = {
			name: 'Previous Clip',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=10'
				self.doCommand(cmd)
			},
		}

		actions.ff = {
			name: 'Fast Forward',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=5'
				self.doCommand(cmd)
			},
		}

		actions.rev = {
			name: 'Fast Reverse',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=6'
				self.doCommand(cmd)
			},
		}

		actions.stepF = {
			name: 'Step Forward',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=7'
				self.doCommand(cmd)
			},
		}

		actions.stepB = {
			name: 'Step Back',
			options: [],
			callback: async function (event) {
				cmd = 'TransportCommand&value=8'
				self.doCommand(cmd)
			},
		}

		actions.format = {
			name: 'Format Drive',
			options: [],
			callback: async function (event) {
				cmd = 'StorageCommand&value=4&configid=0'
				self.doCommand(cmd)
			},
		}

		actions.formatUSB = {
			name: 'Format USB Drive (Ki Pro Go)',
			options: [
				{
					type: 'dropdown',
					label: 'Drive',
					id: 'value',
					default: '5',
					choices: [
						{ id: '5', label: 'USB 1' },
						{ id: '6', label: 'USB 2' },
						{ id: '7', label: 'USB 3' },
						{ id: '8', label: 'USB 4' },
						{ id: '9', label: 'USB 5' },
						{ id: '10', label: 'All ' },
					],
				},
			],
			callback: async function (event) {
				cmd = `StorageCommand&value=${event.options.value}&configid=1`
				self.doCommand(cmd)
			},
		}

		actions.eraseClip = {
			name: 'Erase Clip By Name',
			options: [
				{
					type: 'textinput',
					label: 'Clip Name',
					id: 'idx',
					default: '',
				},
			],
			callback: async function (event) {
				cmd = 'ClipToDelete&value=' + event.options.idx + '&configid=0'
				self.doCommand(cmd)
			},
		}

		actions.eraseClipByDrop = {
			name: 'Erase Clip By List',
			options: [
				{
					type: 'dropdown',
					label: 'Clip Name',
					id: 'idx',
					default: '',
					choices: self.availableClips,
				},
			],
			callback: async function (event) {
				cmd = 'ClipToDelete&value=' + event.options.idx + '&configid=0'
				self.doCommand(cmd)
			},
		}

		actions.customTake = {
			name: 'Set Custom Take Number',
			options: [
				{
					type: 'number',
					label: 'Take Name',
					id: 'idx',
					min: 0,
					max: 999,
					default: 0,
				},
			],
			callback: async function (event) {
				cmd = 'CustomTake&value=' + event.options.idx + '&configid=0'
				self.doCommand(cmd)
			},
		}

		actions.customClipName = {
			name: 'Set Custom Clip Name',
			options: [
				{
					type: 'textinput',
					label: 'Clip Name',
					id: 'clipname',
					default: '',
					useVariables: true,
				},
			],
			callback: async function (event) {
				let clipName = await self.parseVariablesInString(event.options.clipname)
				let setCmd = 'UseCustomClipName&value=1'
				self.doCommand(setCmd)

				cmd = 'CustomClipName&value=' + clipName
				self.doCommand(cmd)
			},
		}

		actions.customClipNameByChannel = {
			name: 'Set Channel x Custom Clip Name (Ki Pro Go)',
			options: [
				{
					type: 'number',
					label: 'Channel Number',
					id: 'channel',
					min: 1,
					max: 4,
					default: 1,
				},
				{
					type: 'textinput',
					label: 'Clip Name',
					id: 'clipname',
					default: '',
					useVariables: true,
				},
			],
			callback: async function (event) {
				let channelNumber = event.options.channel
				let clipName = await self.parseVariablesInString(event.options.clipname)

				cmd = 'Channel_' + channelNumber + '_Clipname&value=' + clipName
				self.doCommand(cmd)
			},
		}

		actions.load = {
			name: 'Load Clip By Name',
			options: [
				{
					type: 'textinput',
					label: 'Clip Name',
					id: 'idx',
					default: '',
				},
			],
			callback: async function (event) {
				cmd = 'GoToClip&value=' + event.options.idx
				self.doCommand(cmd)
			},
		}

		actions.loadByDrop = {
			name: 'Load Clip By List',
			options: [
				{
					type: 'dropdown',
					label: 'Clip Name',
					id: 'idx',
					default: '',
					choices: self.availableClips,
				},
			],
			callback: async function (event) {
				cmd = 'GoToClip&value=' + event.options.idx
				self.doCommand(cmd)
			},
		}

		actions.loop = {
			name: 'Loop Clip',
			options: [
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'idx',
					choices: [
						{ id: '0', label: 'Loop Off' },
						{ id: '1', label: 'Loop On' },
					],
				},
			],
			callback: async function (event) {
				cmd = 'LoopPlay&value=' + event.options.idx
				self.doCommand(cmd)
			},
		}

		actions.setTimecode = {
			name: 'Set Timecode Value',
			options: [
				{
					type: 'dropdown',
					label: 'Timecode',
					id: 'idx',
					default: '0',
					choices: [
						{ id: '0', label: '00:00:00:00' },
						{ id: '1', label: '01:00:00:00' },
						{ id: '2', label: '02:00:00:00' },
						{ id: '3', label: '03:00:00:00' },
						{ id: '4', label: '04:00:00:00' },
						{ id: '5', label: '05:00:00:00' },
						{ id: '6', label: '06:00:00:00' },
						{ id: '7', label: '07:00:00:00' },
						{ id: '8', label: '08:00:00:00' },
						{ id: '9', label: '09:00:00:00' },
						{ id: '10', label: '10:00:00:00' },
						{ id: '11', label: '11:00:00:00' },
						{ id: '12', label: '12:00:00:00' },
						{ id: '13', label: '13:00:00:00' },
						{ id: '14', label: '14:00:00:00' },
						{ id: '15', label: '15:00:00:00' },
						{ id: '16', label: '16:00:00:00' },
						{ id: '17', label: '17:00:00:00' },
						{ id: '18', label: '18:00:00:00' },
						{ id: '19', label: '19:00:00:00' },
						{ id: '20', label: '20:00:00:00' },
						{ id: '21', label: '21:00:00:00' },
						{ id: '22', label: '22:00:00:00' },
						{ id: '23', label: '23:00:00:00' },
					],
				},
			],
			callback: async function (event) {
				cmd = 'TimecodeValue&value=' + event.options.idx
				self.doCommand(cmd)
			},
		}

		actions.setMediaState = {
			name: 'Set Media State',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'idx',
					choices: [
						{ id: '0', label: 'Play/Record' },
						{ id: '1', label: 'LAN' },
					],
				},
			],
			callback: async function (event) {
				cmd = 'MediaState&value=' + event.options.idx
				self.doCommand(cmd)
			},
		}

		self.setActionDefinitions(actions)
	},
}
