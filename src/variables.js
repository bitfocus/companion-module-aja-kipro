module.exports = {
	initVariables() {
		let variables = [
			{name: 'TimeCode Hours',		variableId:  'TC_hours'},
			{name: 'TimeCode Minutes',		variableId:  'TC_min'},
			{name: 'TimeCode Seconds',		variableId:  'TC_sec'},
			{name: 'TimeCode Frames',		variableId:  'TC_frames'},
			{name: 'Transport State',		variableId:  'TransportState'},
			{name: 'Media State',			variableId:  'MediaState'},
			{name: 'Current Clip',			variableId:  'CurrentClip'},
			{name: 'Media Available',		variableId:  'MediaAvailable'},
			{name: 'System Name',			variableId:  'SystemName'}
		]

		this.setVariableDefinitions(variables);
	},

	checkVariables() {
		try {
			let variableObj = {};

			variableObj['TC_hours'] = this.state['TC_hours'];
			variableObj['TC_min'] = this.state['TC_min'];
			variableObj['TC_sec'] = this.state['TC_sec'];
			variableObj['TC_frames'] = this.state['TC_frames'];
			variableObj['TransportState'] = this.state['TransportState'];
			variableObj['MediaState'] = this.state['MediaState'] == '0' ? 'Record/Play' : 'Data/LAN';
			variableObj['CurrentClip'] = this.state['CurrentClip'];
			variableObj['MediaAvailable'] = this.state['MediaAvailable'];
			variableObj['SystemName'] = this.state['SystemName'];

			this.setVariableValues(variableObj);
		}
		catch(error) {
			//do something with that error
			if (this.config.verbose) {
				this.log('debug', 'Error Updating Variables: ' + error);
			}
		}
	}
}