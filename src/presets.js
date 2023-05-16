const { combineRgb } = require('@companion-module/base')

module.exports = {
	initPresets() {
		let self = this;
		
		const presets = [
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Play',
				style: {
					text: 'Play',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'play'
							}
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'transport_state',
						options: {
							state: 'FORWARD'
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(255, 0, 0),
						},
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'PAUSED'
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(255, 255, 0),
						},
					}
				]
			},
			//Stop
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Stop',
				style: {
					text: 'Stop',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'stop'
							}
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'transport_state',
						options: {
							state: 'IDLE'
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(255, 0, 0),
						},
					}
				]
			},
			//Record
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Record',
				style: {
					text: 'Rec',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'rec'
							}
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'transport_state',
						options: {
							state: 'RECORDING'
						},
						style: {
							// The style property is only valid for 'boolean' feedbacks, and defines the style change it will have.
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(255, 0, 0),
						},
					}
				]
			},
			//Next Clip
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Next',
				style: {
					text: 'Next Clip',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'next'
							}
						],
						up: []
					}
				],
				feedbacks: []
			},
			//Previous Clip
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Previous Clip',
				style: {
					text: 'Prev Clip',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'prv'
							}
						],
						up: []
					}
				],
				feedbacks: []
			},
			//Fast Forward
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Fast Forward',
				style: {
					text: 'FF',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'ff'
							}
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'transport_state',
						options: {
							state: 'FORWARD_2X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 51, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'FORWARD_4X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 102, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'FORWARD_8X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 153, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'FORWARD_16X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 204, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'FORWARD_32X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 255, 0),
						}
					}
				]
			},
			//Rewind
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Rewind',
				style: {
					text: 'Rev',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'rev'
							}
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'transport_state',
						options: {
							state: 'REVERSE'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 42, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'REVERSE_2X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 84, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'REVERSE_4X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 126, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'REVERSE_8X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 168, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'REVERSE_16X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 210, 0),
						}
					},
					{
						feedbackId: 'transport_state',
						options: {
							state: 'REVERSE_32X'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 255, 0),
						}
					}
				]
			},
			//Step Forward
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Step Forward',
				style: {
					text: 'Step Forward',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'stepF'
							}
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'transport_state',
						options: {
							state: 'FORWARD_STEP'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 255, 0),
						}
					}
				]
			},
			//Step Backwards
			{
				type: 'button',
				category: 'Transport Control',
				label: 'Step Backwards',
				style: {
					text: 'Step Back',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'stepB'
							}
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'transport_state',
						options: {
							state: 'REVERSE_STEP'
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 255, 0),
						}
					}
				]
			},
			//Full TimeCode
			{
				type: 'button',
				category: 'TimeCode',
				label: 'Full Timecode',
				style: {
					text: '$('+this.label+':TC_hours):$('+this.label+':TC_min):$('+this.label+':TC_sec):$('+this.label+':TC_frames)',
					size: '7',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [],
				feedbacks: []
			},
			//TimeCode Hours
			{
				type: 'button',
				category: 'TimeCode',
				label: 'Timecode Hours',
				style: {
					text: 'HOURS\\n$('+this.label+':TC_hours)',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [],
				feedbacks: []
			},
			//TimeCode Minutes
			{
				type: 'button',
				category: 'TimeCode',
				label: 'Full Minutes',
				style: {
					text: 'MIN\\n$('+this.label+':TC_min)',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [],
				feedbacks: []
			},
			//TimeCode Seconds
			{
				type: 'button',
				category: 'TimeCode',
				label: 'Timecode Seconds',
				style: {
					text: 'SEC\\n$('+this.label+':TC_sec)',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [],
				feedbacks: []
			},
			//TimeCode Frames
			{
				type: 'button',
				category: 'TimeCode',
				label: 'Timecode Frames',
				style: {
					text: 'FRAMES\\n$('+this.label+':TC_frames)',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [],
				feedbacks: []
			},
			//Stop and Format
			{
				type: 'button',
				category: 'Functions',
				label: 'Stop and format',
				style: {
					text: 'Stop & Format',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
					relative_delay: true
				},
				steps: [
					{
						down: [
							{
								actionId: 'stop'
							},
							{
								actionId: 'stop',
								delay: 500
							},
							{
								actionId: 'customTake',
								options:{
									idx: "0"
								},
								delay: 200
							},
							{
								actionId: 'format',
								delay: 200
							}
						],
						up: []
					}
				],
				feedbacks: []
			},
			//Reset Timecode and Record
			{
				type: 'button',
				category: 'Functions',
				label: 'Reset Timecode and Record',
				style: {
					text: 'Reset and Record',
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
					relative_delay: true
				},
				steps: [
					{
						down: [
							{
								actionId: 'setTimecode',
								options:{
									idx: "1"
								},
							},
							{
								actionId: 'setTimecode',
								delay: 10,
								options:{
									idx: "0"
								},
							},
							{
								actionId: 'rec',
								delay: 10
							}
						],
						up: []
					}
				],
				feedbacks: []
			}
		]

		this.setPresetDefinitions(presets)
	},
}