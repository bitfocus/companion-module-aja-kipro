const { combineRgb } = require('@companion-module/base')

module.exports = {
    // ##########################
    // #### Define Feedbacks ####
    // ##########################
    initFeedbacks() {
        let self = this;
        const feedbacks = {};

        const foregroundColorWhite = combineRgb(255, 255, 255) // White
        const foregroundColorBlack = combineRgb(0, 0, 0) // Black
        const backgroundColorRed = combineRgb(255, 0, 0) // Red
        const backgroundColorGreen = combineRgb(0, 255, 0) // Green
        const backgroundColorOrange = combineRgb(255, 102, 0) // Orange

        feedbacks['transport_state'] = {
            type: 'boolean',
            name: 'Change colors based on transport state',
            description: 'Sets the background according to the state of the KiPro playback',
            defaultStyle: {
                color: foregroundColorWhite,
                bgcolor: backgroundColorRed,
            },
            options: [
                {
                    type: 'dropdown',
                    label: 'Indicate in X Status',
                    id: 'state',
					default: 1,
                    choices: Object.keys(this.t_states).map(i => { return {id: i, label: this.t_states[i]} })
                }
            ],
            callback: function (feedback) {
                let opt = feedback.options;

				if (self.state['TransportState'] === feedback.options.state) {
					return true;
				}

                return false;
            }
        }

        feedbacks['media_state'] = {
            type: 'boolean',
            name: 'Change colors based on media state',
            description: 'Sets the background according to the state of the KiPro media',
            defaultStyle: {
                color: foregroundColorBlack,
                bgcolor: backgroundColorGreen,
            },
            options: [
                {
                    type: 'dropdown',
                    label: 'Indicate in X Status',
                    id: 'state',
                    default: '0',
                    choices: [
                        { id: '0', label: 'Record/Play' },
                        { id: '1', label: 'Data/LAN' }
                    ]
                }
            ],
            callback: function (feedback) {
                let opt = feedback.options;

                if (self.state['MediaState'] === feedback.options.state) {
                    return true;
                }

                return false;
            }
        }

        self.setFeedbackDefinitions(feedbacks);
    }
}